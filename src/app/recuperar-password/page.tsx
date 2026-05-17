"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, CheckCircle, Loader2, Phone } from "lucide-react";
import { CLINIC_INFO } from "@/lib/constants/clinic-info";

type State = "idle" | "loading" | "success" | "error";

export default function RecuperarPasswordPage() {
    const [email, setEmail] = useState("");
    const [state, setState] = useState<State>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setState("loading");
        setErrorMsg("");

        try {
            const res = await fetch("/api/auth/reset-password/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al procesar la solicitud");
            }

            setState("success");
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Error inesperado");
            setState("error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Side */}
                <div className="hidden md:flex md:w-1/2 bg-primary-900 text-white flex-col justify-between relative overflow-hidden animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40 backdrop-blur-[1px]" />
                    <div className="relative z-10 p-12 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                    <img src="/logo-clinicas-colina.jpg" alt="Logo" className="h-8 w-auto mix-blend-screen" />
                                </div>
                                <span className="text-xl font-bold tracking-wide">{CLINIC_INFO.name}</span>
                            </div>
                            <h2 className="text-4xl font-bold mb-4 leading-tight">
                                Tu seguridad es<br />
                                <span className="text-primary-200">nuestra prioridad</span>
                            </h2>
                            <p className="text-primary-100 text-lg max-w-md">
                                Te enviaremos un enlace seguro para que puedas crear una nueva contraseña de forma rápida.
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
                            <p className="text-xs text-primary-300/80 max-w-xs">{CLINIC_INFO.address.full}</p>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="md:w-1/2 p-8 md:p-12 bg-white animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="max-w-md mx-auto">
                        {/* Back to login */}
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-lime-600 transition-colors mb-8"
                        >
                            <ArrowLeft size={16} />
                            Volver al inicio de sesión
                        </Link>

                        {state === "success" ? (
                            /* Success state */
                            <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-lime-50 flex items-center justify-center">
                                        <CheckCircle size={40} className="text-lime-600" />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Revisa tu correo!</h1>
                                <p className="text-gray-500 text-sm mb-2 leading-relaxed">
                                    Si <strong className="text-gray-800">{email}</strong> está registrado en el sistema,
                                    recibirás un enlace para restablecer tu contraseña.
                                </p>
                                <p className="text-gray-400 text-xs mb-8">
                                    El enlace es válido por <strong>1 hora</strong>. Revisa también tu carpeta de spam.
                                </p>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { setState("idle"); setEmail(""); }}
                                        className="w-full py-3 rounded-xl border border-lime-200 bg-lime-50 text-lime-700 font-semibold text-sm hover:bg-lime-100 transition-colors"
                                    >
                                        Enviar a otro correo
                                    </button>
                                    <Link
                                        href="/login"
                                        className="block w-full py-3 rounded-xl border border-gray-100 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors text-center"
                                    >
                                        Volver al inicio de sesión
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* Form state */
                            <>
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar contraseña</h1>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {state === "error" && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Correo electrónico
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="ejemplo@correo.com"
                                                required
                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={state === "loading" || !email.trim()}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lime-600 hover:bg-lime-700 disabled:bg-lime-300 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-sm"
                                    >
                                        {state === "loading" ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                Enviar enlace de recuperación
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
