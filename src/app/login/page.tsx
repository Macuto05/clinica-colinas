"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, ArrowRight, Phone } from "lucide-react";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/AuthContext";
import { FormInput } from "@/components/auth/FormInput";
import { CLINIC_INFO } from "@/lib/constants/clinic-info";

import { useSearchParams } from "next/navigation";

export default function LoginPage() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect");

    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al iniciar sesión");
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Side - Image & Info */}
                <div className="hidden md:flex md:w-1/2 bg-primary-900 text-white flex-col justify-between relative overflow-hidden animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000')"
                        }}
                    />

                    {/* Gradient Overlay - Darker for better readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40 backdrop-blur-[1px]" />

                    {/* Content */}
                    <div className="relative z-10 p-12 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                    <img src="/logo-clinicas-colina.jpg" alt="Logo" className="h-8 w-auto mix-blend-screen" />
                                </div>
                                <span className="text-xl font-bold tracking-wide">{CLINIC_INFO.name}</span>
                            </div>
                            <h2 className="text-4xl font-bold mb-4 leading-tight">
                                Tu salud es nuestra <br />
                                <span className="text-primary-200">prioridad número uno</span>
                            </h2>
                            <p className="text-primary-100 text-lg max-w-md">
                                Accede a una experiencia de salud digital completa. Gestiona tus citas y resultados desde cualquier lugar.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-sm text-primary-100 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <div className="bg-primary-500/20 p-2 rounded-full">
                                    <Phone size={20} className="text-primary-200" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Línea de Emergencias</p>
                                    <p>{CLINIC_INFO.contact.emergencyPhone}</p>
                                </div>
                            </div>
                            <p className="text-xs text-primary-300/80 max-w-xs">
                                {CLINIC_INFO.address.full}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="md:w-1/2 p-8 md:p-12 bg-white animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h1>
                            <Link
                                href={redirect ? `/registro?redirect=${redirect}` : "/registro"}
                                className="text-sm font-bold text-primary-600 bg-primary-50 px-5 py-2.5 rounded-full border border-primary-100 transition-all duration-300 transform hover:scale-105 hover:shadow-md hover:bg-primary-600 hover:text-white active:scale-95"
                            >
                                Crear cuenta nueva
                            </Link>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {serverError && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                                    {serverError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <FormInput
                                    label="Correo Electrónico"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    icon={<Mail size={18} />}
                                    error={errors.email?.message}
                                    {...register("email")}
                                />

                                <div className="space-y-1">
                                    <FormInput
                                        label="Contraseña"
                                        type="password"
                                        placeholder="••••••••"
                                        icon={<Lock size={18} />}
                                        error={errors.password?.message}
                                        {...register("password")}
                                    />
                                    <div className="flex justify-end">
                                        <Link
                                            href="/recuperar-password"
                                            className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        Ingresar
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
                            <p>
                                Al iniciar sesión, aceptas nuestros{" "}
                                <Link href="/terminos" className="text-gray-700 hover:underline">
                                    Términos de Servicio
                                </Link>{" "}
                                y{" "}
                                <Link href="/privacidad" className="text-gray-700 hover:underline">
                                    Política de Privacidad
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
