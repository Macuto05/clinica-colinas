"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Lock, Eye, EyeOff, ArrowLeft, CheckCircle,
    Loader2, AlertCircle, Check, X, Phone
} from "lucide-react";
import { CLINIC_INFO } from "@/lib/constants/clinic-info";

type ValidateState = "checking" | "valid" | "invalid";
type SubmitState = "idle" | "loading" | "success" | "error";

function PasswordRule({ met, label }: { met: boolean; label: string }) {
    return (
        <li className={`flex items-center gap-2 text-xs transition-colors ${met ? "text-lime-700" : "text-gray-400"}`}>
            {met
                ? <Check size={13} className="text-lime-600 shrink-0" />
                : <X size={13} className="text-gray-300 shrink-0" />
            }
            {label}
        </li>
    );
}

function NuevaPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [validateState, setValidateState] = useState<ValidateState>("checking");
    const [validateError, setValidateError] = useState("");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [submitState, setSubmitState] = useState<SubmitState>("idle");
    const [submitError, setSubmitError] = useState("");

    // Password rules
    const rules = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    };
    const allRulesMet = Object.values(rules).every(Boolean);
    const passwordsMatch = password === confirm && confirm.length > 0;

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setValidateState("invalid");
            setValidateError("No se encontró el token de recuperación.");
            return;
        }

        fetch(`/api/auth/reset-password/validate?token=${token}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.valid) {
                    setValidateState("valid");
                } else {
                    setValidateState("invalid");
                    setValidateError(data.error || "Enlace inválido.");
                }
            })
            .catch(() => {
                setValidateState("invalid");
                setValidateError("Error al verificar el enlace.");
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allRulesMet || !passwordsMatch) return;

        setSubmitState("loading");
        setSubmitError("");

        try {
            const res = await fetch("/api/auth/reset-password/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error al actualizar la contraseña");

            setSubmitState("success");
            // Redirect to login after 3 seconds
            setTimeout(() => router.push("/login?reset=success"), 3000);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Error inesperado");
            setSubmitState("error");
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
                                Nueva contraseña<br />
                                <span className="text-primary-200">segura y única</span>
                            </h2>
                            <p className="text-primary-100 text-lg max-w-md">
                                Elige una contraseña fuerte para proteger tu cuenta en el sistema de gestión.
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

                        {/* Checking token */}
                        {validateState === "checking" && (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <Loader2 size={32} className="animate-spin text-lime-600" />
                                <p className="text-sm text-gray-500 font-medium">Verificando enlace...</p>
                            </div>
                        )}

                        {/* Invalid token */}
                        {validateState === "invalid" && (
                            <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                                        <AlertCircle size={40} className="text-red-500" />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-3">Enlace inválido</h1>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed">{validateError}</p>
                                <div className="space-y-3">
                                    <Link
                                        href="/recuperar-password"
                                        className="block w-full py-3 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm transition-colors text-center"
                                    >
                                        Solicitar nuevo enlace
                                    </Link>
                                    <Link
                                        href="/login"
                                        className="block w-full py-3 rounded-xl border border-gray-100 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors text-center"
                                    >
                                        Volver al inicio de sesión
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Success */}
                        {submitState === "success" && (
                            <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-lime-50 flex items-center justify-center">
                                        <CheckCircle size={40} className="text-lime-600" />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Contraseña actualizada!</h1>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                    Tu contraseña se ha restablecido correctamente. Serás redirigido al inicio de sesión en unos segundos.
                                </p>
                                <Link
                                    href="/login"
                                    className="block w-full py-3 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm transition-colors text-center"
                                >
                                    Ir al inicio de sesión
                                </Link>
                            </div>
                        )}

                        {/* Valid form */}
                        {validateState === "valid" && submitState !== "success" && (
                            <>
                                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-lime-600 transition-colors mb-8">
                                    <ArrowLeft size={16} />
                                    Volver al inicio de sesión
                                </Link>

                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h1>
                                    <p className="text-gray-500 text-sm">Elige una contraseña segura para tu cuenta.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {submitState === "error" && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm animate-in fade-in">
                                            {submitError}
                                        </div>
                                    )}

                                    {/* Password field */}
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700">Nueva contraseña</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition-all bg-gray-50 focus:bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {/* Password rules */}
                                        {password.length > 0 && (
                                            <ul className="mt-2 space-y-1 pl-1">
                                                <PasswordRule met={rules.length} label="Al menos 8 caracteres" />
                                                <PasswordRule met={rules.upper} label="Una letra mayúscula" />
                                                <PasswordRule met={rules.lower} label="Una letra minúscula" />
                                                <PasswordRule met={rules.number} label="Un número" />
                                            </ul>
                                        )}
                                    </div>

                                    {/* Confirm field */}
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700">Confirmar contraseña</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                value={confirm}
                                                onChange={(e) => setConfirm(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                className={`w-full pl-11 pr-11 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50 focus:bg-white ${
                                                    confirm.length > 0
                                                        ? passwordsMatch
                                                            ? "border-lime-400 focus:ring-lime-400/50"
                                                            : "border-red-300 focus:ring-red-300/50"
                                                        : "border-gray-200 focus:ring-lime-400/50 focus:border-lime-400"
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {confirm.length > 0 && !passwordsMatch && (
                                            <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!allRulesMet || !passwordsMatch || submitState === "loading"}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lime-600 hover:bg-lime-700 disabled:bg-lime-300 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-sm"
                                    >
                                        {submitState === "loading" ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            "Establecer nueva contraseña"
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

export default function NuevaPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
            </div>
        }>
            <NuevaPasswordContent />
        </Suspense>
    );
}
