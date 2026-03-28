"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPortal } from "react-dom";
import { X, Save, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

// Robust Schema matching RegisterInput
const receptionPatientSchema = z.object({
    nombres: z
        .string()
        .min(2, "Nombre debe tener al menos 2 caracteres")
        .max(50, "Nombre muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
    apellidos: z
        .string()
        .min(2, "Apellido debe tener al menos 2 caracteres")
        .max(50, "Apellido muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),

    // Split ID
    idType: z.enum(["V-", "E-", "J-"]),
    idNumber: z.string().min(6, "Mínimo 6 dígitos").max(12, "Máximo 12 dígitos").regex(/^\d+$/, "Solo números"),

    fechaNacimiento: z.string().refine((date) => {
        if (!date) return true; // Optional logic if needed, but here let's make it standard
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 0 && age <= 120;
    }, "Fecha inválida").optional().or(z.literal("")),

    sexo: z.string().min(1, "Sexo es requerido"),

    // Contact
    correo: z.string().email("Correo inválido").optional().or(z.literal("")),

    // Split Phone
    phoneCode: z.enum(["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"]),
    phoneNumber: z.string().min(7, "Mínimo 7 dígitos").max(7, "Máximo 7 dígitos").regex(/^\d+$/, "Solo números"),

    direccion: z.string().optional(),

    // Account Data (Optional if not creating user, but standard here)
    createAccount: z.boolean().optional(),
    correoAcceso: z.string().email("Correo inválido").optional().or(z.literal("")),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
    // If correoAcceso is provided, password is required
    // If correoAcceso is provided and password has been entered
    if (data.correoAcceso && data.correoAcceso.length > 0) {
        // Only validate password complexity IF provided. 
        // Logic for REQUIERED password on Create should differ, but standardizing here:
        // Ideally we'd know if it's CREATE or UPDATE, but schema doesn't.
        // We'll trust the user or backend to reject empty passwords on CREATE.

        if (data.password && data.password.length > 0) {
            if (data.password.length < 8) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "La contraseña debe tener al menos 8 caracteres",
                    path: ["password"],
                });
            }
            if (!/[A-Z]/.test(data.password)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Debe contener al menos una mayúscula",
                    path: ["password"],
                });
            }
            if (!/[0-9]/.test(data.password)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Debe contener al menos un número",
                    path: ["password"],
                });
            }
            if (data.password !== data.confirmPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Las contraseñas no coinciden",
                    path: ["confirmPassword"],
                });
            }
        }
    }
});

type PatientFormData = z.infer<typeof receptionPatientSchema>;

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

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm<PatientFormData>({
        resolver: zodResolver(receptionPatientSchema),
        mode: "onChange",
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

            if (patient) {
                // Parse Split Fields
                const docType = patient.documento.substring(0, 2) as any;
                const docNum = patient.documento.substring(2);
                const phoneCode = patient.telefono.substring(0, 5) as any;
                const phoneNum = patient.telefono.substring(5);

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
            // Manual Validation for CREATE
            if (!patient && data.correoAcceso && (!data.password || data.password.length === 0)) {
                throw new Error("La contraseña es requerida para crear un nuevo usuario");
            }

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

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8 flex-1 overflow-y-auto">
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
                                    <input {...register("nombres")} className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400" placeholder="Juan" />
                                    {errors.nombres && <p className="text-red-500 text-xs mt-1">{errors.nombres.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Apellidos</label>
                                    <input {...register("apellidos")} className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400" placeholder="Pérez" />
                                    {errors.apellidos && <p className="text-red-500 text-xs mt-1">{errors.apellidos.message}</p>}
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
                                    <input {...register("idNumber")} className="flex-1 px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400" placeholder="12345678" />
                                </div>
                                {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber.message}</p>}
                            </div>

                            {/* Stacked Date & Sex for better spacing layout */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Fecha Nacimiento</label>
                                <input type="date" {...register("fechaNacimiento")} className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Sexo</label>
                                <select {...register("sexo")} className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all">
                                    <option value="">Seleccionar</option>
                                    <option value="MASCULINO">Masculino</option>
                                    <option value="FEMENINO">Femenino</option>
                                    <option value="OTRO">Otro</option>
                                </select>
                                {errors.sexo && <p className="text-red-500 text-xs mt-1">{errors.sexo.message}</p>}
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
                                    <input {...register("phoneNumber")} className="flex-1 px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400" placeholder="1234567" />
                                </div>
                                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Correo de Contacto</label>
                                <input {...register("correo")} className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400" placeholder="contacto@ejemplo.com" />
                                <p className="text-xs text-gray-500 mt-1">Donde recibirá notificaciones</p>
                                {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Dirección</label>
                                <textarea {...register("direccion")} rows={5} className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 resize-none" placeholder="Dirección completa..." />
                            </div>
                        </div>

                        {/* Account Data - Always Visible to Allow Edits */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-white/40">Cuenta de Acceso</h4>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Correo de Acceso</label>
                                    <input {...register("correoAcceso")} className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400" placeholder="usuario@login.com" />
                                    <p className="text-xs text-gray-500 mt-1">Para acceso al sistema</p>
                                    {errors.correoAcceso && <p className="text-red-500 text-xs mt-1">{errors.correoAcceso.message}</p>}
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
                                                className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 pr-10"
                                                placeholder={patient ? "Dejar vacía para mantener actual" : "••••••••"}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                        {password && <PasswordStrengthIndicator password={password} />}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Confirmar Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                {...register("confirmPassword")}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 pr-10"
                                                placeholder="••••••••"
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
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
