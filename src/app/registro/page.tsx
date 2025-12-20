"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/AuthContext";
import { FormInput } from "@/components/auth/FormInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { CLINIC_INFO } from "@/lib/constants/clinic-info";

import { useSearchParams } from "next/navigation";

export default function RegistroPage() {
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
                                        label="Nombre"
                                        placeholder="Tu nombre"
                                        error={errors.firstName?.message}
                                        {...register("firstName")}
                                    />
                                    <FormInput
                                        label="Apellido"
                                        placeholder="Tu apellido"
                                        error={errors.lastName?.message}
                                        {...register("lastName")}
                                    />
                                    <FormInput
                                        label="Cédula de Identidad"
                                        placeholder="V-12345678"
                                        error={errors.idCard?.message}
                                        {...register("idCard")}
                                    />
                                    <FormInput
                                        label="Fecha de Nacimiento"
                                        type="date"
                                        error={errors.birthDate?.message}
                                        {...register("birthDate")}
                                    />
                                </div>
                            </section>

                            {/* Contact Information */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                    Información de Contacto
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Correo Electrónico"
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        error={errors.email?.message}
                                        {...register("email")}
                                    />
                                    <FormInput
                                        label="Teléfono"
                                        placeholder="0414-1234567"
                                        error={errors.phone?.message}
                                        {...register("phone")}
                                    />
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

                            {/* Security */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                    Seguridad
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        {...register("acceptTerms")}
                                    />
                                </div>
                                <div className="text-sm">
                                    <label htmlFor="terms" className="font-medium text-gray-700">
                                        Acepto los términos y condiciones
                                    </label>
                                    <p className="text-gray-500">
                                        Al crear una cuenta, aceptas nuestros{" "}
                                        <Link href="/terminos" className="text-primary-600 hover:underline">
                                            Términos de Servicio
                                        </Link>{" "}
                                        y{" "}
                                        <Link href="/privacidad" className="text-primary-600 hover:underline">
                                            Política de Privacidad
                                        </Link>
                                        .
                                    </p>
                                    {errors.acceptTerms && (
                                        <p className="text-red-500 mt-1">{errors.acceptTerms.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t">
                                <Link
                                    href={redirect ? `/login?redirect=${redirect}` : "/login"}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                                >
                                    ¿Ya tienes cuenta? Inicia sesión
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Creando cuenta...
                                        </>
                                    ) : (
                                        <>
                                            Crear Cuenta
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
