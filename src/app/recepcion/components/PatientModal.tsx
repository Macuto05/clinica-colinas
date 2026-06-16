"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPortal } from "react-dom";
import { X, Save, Loader2, AlertCircle, Eye, EyeOff, UserCog, Shield } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import PatientInsuranceSection from "@/components/insurance/PatientInsuranceSection";

// Base: all fields required for both create and edit
const receptionBaseSchema = z.object({
    nombres: z.string().min(2, "Nombre debe tener al menos 2 caracteres").max(50, "Nombre muy largo").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo letras"),
    apellidos: z.string().min(2, "Apellido debe tener al menos 2 caracteres").max(50, "Apellido muy largo").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo letras"),
    idType: z.enum(["V-", "E-", "J-"]),
    idNumber: z.string().min(6, "Mínimo 6 dígitos").max(12, "Máximo 12 dígitos").regex(/^\d+$/, "Solo números"),
    fechaNacimiento: z.string().min(1, "Fecha de nacimiento requerida"),
    sexo: z.string().min(1, "Sexo requerido"),
    correo: z.string().min(1, "Correo de contacto requerido").email("Correo de contacto inválido"),
    phoneCode: z.enum(["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"]),
    phoneNumber: z.string().min(7, "Mínimo 7 dígitos").max(7, "Máximo 7 dígitos").regex(/^\d+$/, "Solo números"),
    direccion: z.string().min(1, "Dirección requerida"),
    createAccount: z.boolean().optional(),
});

// CREATE: correoAcceso + password + confirmPassword requeridos y completamente validados
const createReceptionPatientSchema = receptionBaseSchema.extend({
    correoAcceso: z.string().min(1, "Correo de acceso requerido").email("Correo de acceso inválido"),
    password: z.string()
        .min(8, "Mínimo 8 caracteres")
        .regex(/[A-Z]/, "Debe tener al menos una letra mayúscula")
        .regex(/[0-9]/, "Debe tener al menos un número"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Las contraseñas no coinciden", path: ["confirmPassword"] });
    }
});

// EDIT: correoAcceso opcional, contraseña opcional pero validada si se provee
const editReceptionPatientSchema = receptionBaseSchema.extend({
    correoAcceso: z.union([z.string().email("Correo de acceso inválido"), z.literal("")]).optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.password && data.password.trim() !== "") {
        if (data.password.length < 8)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mínimo 8 caracteres", path: ["password"] });
        if (!/[A-Z]/.test(data.password))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe tener al menos una letra mayúscula", path: ["password"] });
        if (!/[0-9]/.test(data.password))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe tener al menos un número", path: ["password"] });
        if (data.password !== data.confirmPassword)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Las contraseñas no coinciden", path: ["confirmPassword"] });
    }
});

type PatientFormData = {
    nombres: string; apellidos: string;
    idType: "V-" | "E-" | "J-"; idNumber: string;
    fechaNacimiento: string; sexo: string; correo: string; direccion: string;
    phoneCode: "0412-" | "0414-" | "0416-" | "0424-" | "0426-" | "0422-"; phoneNumber: string;
    correoAcceso?: string; password?: string; confirmPassword?: string; createAccount?: boolean;
};

interface PatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient?: any;
    onSuccess: () => void;
}

export function PatientModal({ isOpen, onClose, patient, onSuccess }: PatientModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<"datos" | "seguro">("datos");

    const isEditing = !!patient;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm<PatientFormData>({
        resolver: zodResolver(isEditing ? editReceptionPatientSchema : createReceptionPatientSchema) as any,
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: {
            idType: "V-",
            phoneCode: "0412-"
        }
    });

    const password = useWatch({ control, name: "password" });

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setShowPassword(false);
            setShowConfirmPassword(false);
            setActiveTab("datos");

            if (patient) {
                // Parse Split Fields
                const docType = patient.documento.substring(0, 2) as any;
                const docNum = patient.documento.substring(2);
                const tel = patient.telefono || "";
                const phoneCode = tel.substring(0, 5) as any;
                const phoneNum = tel.substring(5);

                setValue("nombres", patient.nombres);
                setValue("apellidos", patient.apellidos);

                // ID
                if (["V-", "E-", "J-"].includes(docType)) {
                    setValue("idType", docType);
                    setValue("idNumber", docNum);
                } else {
                    setValue("idType", "V-");
                    setValue("idNumber", patient.documento);
                }

                // Phone
                if (["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"].includes(phoneCode)) {
                    setValue("phoneCode", phoneCode);
                    setValue("phoneNumber", phoneNum);
                } else {
                    setValue("phoneCode", "0412-");
                    setValue("phoneNumber", patient.telefono);
                }

                setValue("correo", (patient.contactEmail && patient.contactEmail !== 'N/A') ? patient.contactEmail : "");
                setValue("direccion", patient.direccion || "");
                setValue("sexo", patient.sexo || "");
                if (patient.fechaNacimiento) {
                    setValue("fechaNacimiento", new Date(patient.fechaNacimiento).toISOString().split('T')[0]);
                }

                // Account Data
                setValue("correoAcceso", (patient.accessEmail && patient.accessEmail !== 'N/A') ? patient.accessEmail : "");
                setValue("password", ""); // Leave empty for security (only fill if changing)
                setValue("confirmPassword", "");

            } else {
                reset({
                    nombres: "",
                    apellidos: "",
                    idType: "V-",
                    idNumber: "",
                    phoneCode: "0412-",
                    phoneNumber: "",
                    correo: "",
                    fechaNacimiento: "",
                    direccion: "",
                    sexo: "",
                    correoAcceso: "",
                    password: "",
                    confirmPassword: ""
                });
            }
        }
    }, [isOpen, patient, setValue, reset]);

    const onSubmit = async (data: PatientFormData) => {
        setIsSaving(true);
        setError(null);
        try {
            // Transform Data for API
            const payload = {
                nombres: data.nombres,
                apellidos: data.apellidos,
                documentoIdentidad: `${data.idType}${data.idNumber}`,
                telefono: `${data.phoneCode}${data.phoneNumber}`,
                correo: data.correo,
                fechaNacimiento: data.fechaNacimiento,
                direccion: data.direccion,
                sexo: data.sexo,
                // Account Data
                correoAcceso: data.correoAcceso,
                password: data.password
            };

            const url = patient
                ? `/api/reception/patients/${patient.id}`
                : `/api/reception/patients`;

            const method = patient ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Error al guardar");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full max-w-5xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden max-h-[100vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/40 bg-white/30 shrink-0 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                        {patient ? "Editar Paciente" : "Registrar Nuevo Paciente"}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/60 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs — only when editing */}
                {patient && (
                    <div className="flex gap-1 px-6 pt-4 shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab("datos")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                                activeTab === "datos"
                                    ? "bg-lime-500 text-white shadow-sm"
                                    : "bg-white/40 text-gray-600 hover:bg-white/60"
                            }`}
                        >
                            <UserCog size={15} /> Datos del Paciente
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("seguro")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                                activeTab === "seguro"
                                    ? "bg-lime-500 text-white shadow-sm"
                                    : "bg-white/40 text-gray-600 hover:bg-white/60"
                            }`}
                        >
                            <Shield size={15} /> Seguro Médico
                        </button>
                    </div>
                )}

                {/* Insurance Tab */}
                {activeTab === "seguro" && patient && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <PatientInsuranceSection pacienteId={patient.id} />
                    </div>
                )}

                {/* Form (hidden when insurance tab active) */}
                <form onSubmit={handleSubmit(onSubmit)} className={`p-6 space-y-8 flex-1 overflow-y-auto ${activeTab === "seguro" ? "hidden" : ""}`}>
                    {error && (
                        <div className="p-4 bg-red-50/70 border border-red-200/50 text-red-600 rounded-2xl text-sm flex items-center gap-2 backdrop-blur-sm shadow-sm font-bold">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Personal Info */}
                        <div className="space-y-5">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-white/40">Información Personal</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Nombres</label>
                                    <input {...register("nombres")} placeholder="Juan"
                                        className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${errors.nombres ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`} />
                                    {errors.nombres && <p className="text-red-500 text-xs mt-1 font-bold">{errors.nombres.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Apellidos</label>
                                    <input {...register("apellidos")} placeholder="Pérez"
                                        className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${errors.apellidos ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`} />
                                    {errors.apellidos && <p className="text-red-500 text-xs mt-1 font-bold">{errors.apellidos.message}</p>}
                                </div>
                            </div>

                            {/* Split ID */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Documento Identidad</label>
                                <div className="flex gap-2">
                                    <select {...register("idType")} className="w-24 px-4 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all">
                                        <option value="V-">V-</option>
                                        <option value="E-">E-</option>
                                        <option value="J-">J-</option>
                                    </select>
                                    <input {...register("idNumber")} placeholder="12345678"
                                        className={`flex-1 px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${errors.idNumber ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`} />
                                </div>
                                {errors.idNumber && <p className="text-red-500 text-xs mt-1 font-bold">{errors.idNumber.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Fecha Nacimiento</label>
                                <input type="date" {...register("fechaNacimiento")}
                                    className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${errors.fechaNacimiento ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`} />
                                {errors.fechaNacimiento && <p className="text-red-500 text-xs mt-1 font-bold">{errors.fechaNacimiento.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Sexo</label>
                                <select {...register("sexo")}
                                    className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all ${errors.sexo ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}>
                                    <option value="">Seleccionar</option>
                                    <option value="MASCULINO">Masculino</option>
                                    <option value="FEMENINO">Femenino</option>
                                    <option value="OTRO">Otro</option>
                                </select>
                                {errors.sexo && <p className="text-red-500 text-xs mt-1 font-bold">{errors.sexo.message}</p>}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-5">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-white/40">Contacto</h4>

                            {/* Split Phone */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Teléfono</label>
                                <div className="flex gap-2">
                                    <select {...register("phoneCode")} className="w-28 px-4 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all">
                                        <option value="0412-">0412</option>
                                        <option value="0414-">0414</option>
                                        <option value="0424-">0424</option>
                                        <option value="0416-">0416</option>
                                        <option value="0426-">0426</option>
                                        <option value="0422-">0422</option>
                                    </select>
                                    <input {...register("phoneNumber")} placeholder="1234567"
                                        className={`flex-1 px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${errors.phoneNumber ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`} />
                                </div>
                                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phoneNumber.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Correo de Contacto</label>
                                <input {...register("correo")} placeholder="contacto@ejemplo.com"
                                    className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${errors.correo ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`} />
                                {errors.correo
                                    ? <p className="text-red-500 text-xs mt-1 font-bold">{errors.correo.message}</p>
                                    : <p className="text-xs text-gray-500 mt-1">Donde recibirá notificaciones</p>
                                }
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Dirección</label>
                                <textarea {...register("direccion")} rows={5} placeholder="Dirección completa..."
                                    className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 resize-none ${errors.direccion ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`} />
                                {errors.direccion && <p className="text-red-500 text-xs mt-1 font-bold">{errors.direccion.message}</p>}
                            </div>
                        </div>

                        {/* Account Data */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-white/40">Cuenta de Acceso</h4>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Correo de Acceso</label>
                                    <input {...register("correoAcceso")} placeholder="usuario@login.com"
                                        className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${errors.correoAcceso ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`} />
                                    {errors.correoAcceso
                                        ? <p className="text-red-500 text-xs mt-1 font-bold">{errors.correoAcceso.message}</p>
                                        : <p className="text-xs text-gray-500 mt-1">Para acceso al sistema</p>
                                    }
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">
                                            {patient ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                {...register("password")}
                                                placeholder={patient ? "Dejar vacía para mantener actual" : "••••••••"}
                                                className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 pr-10 ${errors.password ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-red-500 text-xs mt-1 font-bold">{errors.password.message}</p>}
                                        {password && <PasswordStrengthIndicator password={password} />}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Confirmar Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                {...register("confirmPassword")}
                                                placeholder="••••••••"
                                                className={`w-full px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 pr-10 ${errors.confirmPassword ? "border border-red-400 bg-red-50/30 focus:bg-red-50/50" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-bold">{errors.confirmPassword.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/40 flex gap-3 shrink-0 bg-white/30 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] py-3.5 rounded-2xl bg-lime-500/95 hover:bg-lime-500 text-white font-bold shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {patient ? "Guardar Cambios" : "Registrar Paciente"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
