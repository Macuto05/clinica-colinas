"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Edit2, Lock, Save, X, FileDown, Loader2, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/auth/FormInput";
import { generateClinicalHistoryPDF } from "@/lib/generate-history-pdf";
import { toast } from "sonner";

const editProfileSchema = z.object({
    contactEmail: z.string().email("Email inválido").optional().or(z.literal('')),
    accessEmail: z.string().email("Email inválido").optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [historyDate, setHistoryDate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<EditProfileForm>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            contactEmail: user?.contactEmail || "",
            accessEmail: user?.email || "",
            phone: user?.phone || "",
            address: user?.address || "",
        }
    });

    useEffect(() => {
        // Fetch history metadata on mount
        const fetchHistoryMetadata = async () => {
            try {
                const res = await fetch("/api/patient/clinical-history");
                if (res.ok) {
                    const data = await res.json();
                    if (data.updatedAt) {
                        setHistoryDate(new Date(data.updatedAt));
                    }
                }
            } catch (err) {
                // Silent error
                console.error("Could not fetch history metadata", err);
            }
        };
        fetchHistoryMetadata();
    }, []);

    if (!user) {
        return null;
    }

    const calculateAge = (birthDate: string | Date | undefined) => {
        if (!birthDate) return null;
        const dob = new Date(birthDate);
        const diffMs = Date.now() - dob.getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    const handleDownloadHistory = async () => {
        setIsDownloading(true);
        try {
            const res = await fetch("/api/patient/clinical-history");
            if (!res.ok) {
                if (res.status === 404) throw new Error("No tienes una historia clínica registrada aún.");
                throw new Error("Error al obtener historia clínica");
            }
            const data = await res.json();

            // Map User Data to Patient Data format
            const patientData = {
                nombres: user.firstName || "",
                apellidos: user.lastName || "",
                cedula: user.documentId || "",
                fechaNacimiento: user.birthDate || "",
                sexo: user.sex || ""
            };

            generateClinicalHistoryPDF(patientData, data.contenido || {});
            toast.success("Historia clínica descargada");

            // Update the date if newly fetched
            if (data.updatedAt) {
                setHistoryDate(new Date(data.updatedAt));
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al descargar");
        } finally {
            setIsDownloading(false);
        }
    };

    const onSubmit = async (data: EditProfileForm) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactEmail: data.contactEmail,
                    accessEmail: data.accessEmail,
                    password: data.password,
                    phone: data.phone,
                    address: data.address,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Error al actualizar perfil");
            }

            setSuccess("Perfil actualizado con éxito");
            setIsEditing(false);
            if (refreshUser) refreshUser();
            else window.location.reload();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mi Perfil</h1>
                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <div className="flex flex-col items-end gap-1">
                        <button
                            onClick={handleDownloadHistory}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-md border border-white/80 text-gray-700 font-bold rounded-2xl hover:bg-white transition-all disabled:opacity-50 shadow-sm focus:ring-2 focus:ring-lime-300"
                        >
                            {isDownloading ? <Loader2 size={18} className="animate-spin text-lime-600" /> : <FileDown size={18} className="text-lime-600" />}
                            Descargar Historial Médico
                        </button>
                        {historyDate && (
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1">
                                Última modificación: {historyDate.toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setIsEditing(true);
                            reset({
                                contactEmail: user.contactEmail || "",
                                accessEmail: user.email || "",
                                phone: user.phone || "",
                                address: user.address || "",
                            });
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-lime-500/95 backdrop-blur-md text-white font-bold rounded-2xl border border-lime-400/50 hover:bg-lime-600 shadow-[0_4px_12px_rgba(132,204,22,0.3)] transition-all focus:ring-2 focus:ring-lime-300"
                    >
                        <Edit2 size={18} />
                        Editar Perfil
                    </button>
                </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
                <div className="relative h-32 bg-gradient-to-r from-lime-500 to-lime-600">
                    <div className="absolute -bottom-12 left-8">
                        <div className="h-24 w-24 rounded-full bg-white/40 backdrop-blur-md p-1 border border-white/50 shadow-lg">
                            <div className="h-full w-full rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center text-lime-700 font-black text-4xl shadow-inner border border-white">
                                {user.firstName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8 sm:px-10">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-gray-500 font-medium text-lg mt-1">{user.email}</p>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        {/* Personal Info - READ ONLY */}
                        <div className="bg-white/50 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-white pb-3">
                                Información Personal
                            </h3>

                            <div className="space-y-4">
                                <BioItem icon={CreditCard} label="Cédula de Identidad" value={user.documentId} />
                                <BioItem
                                    icon={Calendar}
                                    label="Fecha de Nacimiento"
                                    value={user.birthDate ? (() => {
                                        const d = new Date(user.birthDate);
                                        return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
                                    })() : undefined}
                                />
                                <BioItem
                                    icon={User}
                                    label="Sexo"
                                    value={user.sex === 'M' ? 'Masculino' : user.sex === 'F' ? 'Femenino' : user.sex}
                                />
                                <BioItem
                                    icon={Clock}
                                    label="Edad"
                                    value={user.birthDate ? `${calculateAge(user.birthDate)} años` : "No registrado"}
                                />
                            </div>
                        </div>

                        {/* Contact Info - EDITABLE via Modal, Read Only here */}
                        <div className="bg-white/50 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-white pb-3">
                                Información de Contacto y Cuenta
                            </h3>

                            <div className="space-y-4">
                                <BioItem icon={Phone} label="Teléfono" value={user.phone} />
                                <BioItem icon={MapPin} label="Dirección" value={user.address} />
                                <BioItem icon={Mail} label="Correo de Contacto" value={user.contactEmail} />
                                <BioItem icon={Lock} label="Correo de Acceso" value={user.email} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
                    <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-2xl max-h-full flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden">
                        
                        {/* Header */}
                        <div className="p-6 sm:p-8 border-b border-white/40 bg-white/30 backdrop-blur-md flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Perfil</h2>
                                <p className="text-sm font-medium text-gray-500 tracking-wider mt-1">Actualiza tus datos personales y de cuenta.</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="w-10 h-10 bg-white/50 hover:bg-white rounded-full flex items-center justify-center border border-white/60 shadow-sm transition-all text-gray-500 hover:text-gray-800">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrolling Body */}
                        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 custom-scrollbar">
                            <form id="editProfileForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-700/90 rounded-2xl flex items-center gap-2 border border-red-200/50 shadow-sm backdrop-blur-md">
                                        <AlertCircle size={20} />
                                        <span className="text-sm font-bold">{error}</span>
                                    </div>
                                )}

                                {/* Section 1: Datos de Contacto */}
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">1</span>
                                        <h4 className="font-bold text-gray-800 text-base">Datos de Contacto</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</label>
                                            <input
                                                {...register("phone")}
                                                className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección</label>
                                            <input
                                                {...register("address")}
                                                className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Correo de Contacto</label>
                                            <input
                                                {...register("contactEmail")}
                                                className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800"
                                            />
                                            <p className="text-xs font-medium text-gray-400/80 italic ml-1">Utilizado para notificaciones y envío de resultados médicos.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: Seguridad y Acceso */}
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">2</span>
                                        <h4 className="font-bold text-gray-800 text-base">Seguridad y Acceso</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Correo de Acceso (Login)</label>
                                            <input
                                                {...register("accessEmail")}
                                                className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/50 pt-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nueva Contraseña</label>
                                                <input
                                                    type="password"
                                                    {...register("password")}
                                                    placeholder="Dejar vacía para no cambiar"
                                                    className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 placeholder:text-gray-400"
                                                />
                                                {errors.password && <p className="text-red-500 text-xs font-bold">{errors.password.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmar Contraseña</label>
                                                <input
                                                    type="password"
                                                    {...register("confirmPassword")}
                                                    placeholder="Confirmar nueva contraseña"
                                                    className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 placeholder:text-gray-400"
                                                />
                                                {errors.confirmPassword && <p className="text-red-500 text-xs font-bold">{errors.confirmPassword.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </form>
                        </div>

                        {/* Footer (Sticky Actions) */}
                        <div className="p-6 sm:p-8 border-t border-white/40 flex justify-end gap-3 shrink-0 bg-white/30 backdrop-blur-md">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="editProfileForm"
                                disabled={isLoading}
                                className="px-8 py-3.5 bg-lime-500/95 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-lime-600 disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_12px_rgba(132,204,22,0.3)] border border-lime-400/50 transition-all outline-none focus:ring-2 focus:ring-lime-300"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} /> Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BioItem({ icon: Icon, label, value }: { icon: any, label: string, value?: string | null }) {
    return (
        <div className="flex items-center gap-4 bg-white/30 backdrop-blur-sm p-3 rounded-2xl border border-white/50 transition-all hover:bg-white/50">
            <div className="h-12 w-12 rounded-[1rem] bg-lime-500/10 flex items-center justify-center text-lime-700 shadow-inner border border-lime-500/20">
                <Icon size={22} className="opacity-90" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase text-gray-400 tracking-wider mb-0.5">{label}</p>
                <p className="font-bold text-gray-800 text-sm truncate">{value || "No registrado"}</p>
            </div>
        </div>
    );
}
