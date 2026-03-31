"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/AuthContext";
import { FormInput } from "@/components/auth/FormInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CLINIC_INFO } from "@/lib/constants/clinic-info";

import { useSearchParams } from "next/navigation";

export default function RegistroPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-lime-600" /></div>}>
            <RegistroContent />
        </Suspense>
    );
}

function RegistroContent() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect");

    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
        defaultValues: {
            idType: "V-",
            phoneCode: "0412-",
            sex: "",
        }
    });

    const password = watch("password", "");

    const onSubmit = async (data: RegisterInput) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al registrarse");
            }

            login(result.user, redirect || undefined);
        } catch (error) {
            if (error instanceof Error) {
                setServerError(error.message);
            } else {
                setServerError("Ocurrió un error inesperado");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Crear Cuenta de Paciente</h1>
                    <p className="mt-2 text-gray-600">
                        Únete a {CLINIC_INFO.name} para gestionar tu salud de manera digital
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            {serverError && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                    <CheckCircle2 size={18} className="rotate-45" />
                                    {serverError}
                                </div>
                            )}

                            {/* Personal Information */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                    Información Personal
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Nombres"
                                        placeholder="Ej: Juan Carlos"
                                        error={errors.firstName?.message}
                                        {...register("firstName")}
                                    />
                                    <FormInput
                                        label="Apellidos"
                                        placeholder="Ej: Pérez Rodríguez"
                                        error={errors.lastName?.message}
                                        {...register("lastName")}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Documento de Identidad
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="w-24">
                                                <Select
                                                    options={[
                                                        { value: "V-", label: "V-" },
                                                        { value: "E-", label: "E-" },
                                                        { value: "J-", label: "J-" }
                                                    ]}
                                                    error={errors.idType?.message}
                                                    {...register("idType")}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <FormInput
                                                    placeholder="12345678"
                                                    error={errors.idNumber?.message}
                                                    {...register("idNumber")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <FormInput
                                        label="Fecha de Nacimiento"
                                        type="date"
                                        error={errors.birthDate?.message}
                                        {...register("birthDate")}
                                    />
                                    <div className="md:col-span-2">
                                        <Select
                                            label="Sexo"
                                            options={[
                                                { value: "MASCULINO", label: "Masculino" },
                                                { value: "FEMENINO", label: "Femenino" },
                                                { value: "OTRO", label: "Otro" }
                                            ]}
                                            placeholder="Seleccionar..."
                                            error={errors.sex?.message}
                                            {...register("sex")}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Contact Information */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                    Información de Contacto
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <FormInput
                                            label="Correo de Contacto"
                                            type="email"
                                            placeholder="contacto@ejemplo.com"
                                            icon={<span className="text-xs text-gray-400">@</span>}
                                            error={errors.contactEmail?.message}
                                            {...register("contactEmail")}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Este correo se usará para enviarte notificaciones y resultados.
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Teléfono
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="w-28">
                                                <Select
                                                    options={[
                                                        { value: "0412-", label: "0412" },
                                                        { value: "0422-", label: "0422" },
                                                        { value: "0414-", label: "0414" },
                                                        { value: "0424-", label: "0424" },
                                                        { value: "0416-", label: "0416" },
                                                        { value: "0426-", label: "0426" }
                                                    ]}
                                                    error={errors.phoneCode?.message}
                                                    {...register("phoneCode")}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <FormInput
                                                    placeholder="1234567"
                                                    error={errors.phoneNumber?.message}
                                                    {...register("phoneNumber")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <FormInput
                                            label="Dirección"
                                            placeholder="Tu dirección completa"
                                            error={errors.address?.message}
                                            {...register("address")}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Account Data */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                    Datos de Cuenta
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <FormInput
                                            label="Correo de Acceso (Usuario)"
                                            type="email"
                                            placeholder="usuario@login.com"
                                            error={errors.email?.message}
                                            {...register("email")}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Este correo será tu usuario para iniciar sesión en el sistema.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <FormInput
                                            label="Contraseña"
                                            type="password"
                                            placeholder="••••••••"
                                            error={errors.password?.message}
                                            {...register("password")}
                                        />
                                        <PasswordStrengthIndicator password={password} />
                                    </div>
                                    <FormInput
                                        label="Confirmar Contraseña"
                                        type="password"
                                        placeholder="••••••••"
                                        error={errors.confirmPassword?.message}
                                        {...register("confirmPassword")}
                                    />
                                </div>
                            </section>

                            {/* Terms */}
                            <div className="flex items-start gap-3 pt-4">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        className="h-4 w-4 text-lime-600 focus:ring-lime-500 border-gray-300 rounded"
                                        {...register("acceptTerms")}
                                    />
                                </div>
                                <div className="text-sm">
                                    <label htmlFor="terms" className="font-medium text-gray-700">
                                        Acepto los términos y condiciones
                                    </label>
                                    <p className="text-gray-500">
                                        Al crear una cuenta, aceptas nuestros{" "}
                                        <Link href="/terminos" className="text-lime-600 hover:underline">
                                            Términos de Servicio
                                        </Link>{" "}
                                        y{" "}
                                        <Link href="/privacidad" className="text-lime-600 hover:underline">
                                            Política de Privacidad
                                        </Link>
                                        .
                                    </p>
                                    {errors.acceptTerms && (
                                        <p className="text-red-500 mt-1">{errors.acceptTerms.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Insurance Note */}
                            <div className="flex items-start gap-3 p-4 bg-lime-50/70 border border-lime-200/60 rounded-xl">
                                <span className="text-xl mt-0.5">🛡️</span>
                                <div>
                                    <p className="text-sm font-semibold text-lime-800">¿Tienes seguro médico?</p>
                                    <p className="text-xs text-lime-700 mt-0.5">
                                        Puedes registrar tu póliza de seguro una vez creada tu cuenta, desde tu <strong>perfil</strong> en la sección &quot;Seguro Médico&quot;, o acercarte a la clínica y el personal de recepción te ayudará a configurarlo.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t">
                                <Link
                                    href={redirect ? `/login?redirect=${redirect}` : "/login"}
                                    className="text-sm font-medium text-lime-600 hover:text-lime-500"
                                >
                                    ¿Ya tienes cuenta? Inicia sesión
                                </Link>
                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    rightIcon={<ArrowRight size={20} />}
                                    className="shadow-lg shadow-lime-600/20"
                                >
                                    Crear Cuenta
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
