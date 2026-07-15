"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Edit2, Lock, Save, X, FileDown, Loader2, Clock, AlertCircle, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateClinicalHistoryPDF } from "@/lib/generate-history-pdf";
import { toast } from "sonner";
import PatientInsuranceSection from "@/components/insurance/PatientInsuranceSection";

const editProfileSchema = z.object({
    contactEmail: z.string().min(1, "El correo de contacto es requerido").email("Email de contacto inválido"),
    accessEmail: z.string().min(1, "El correo de acceso es requerido").email("Email de acceso inválido"),
    address: z.string().min(1, "La dirección es requerida"),
    password: z.string().optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    if (data.password && data.password.trim() !== '') {
        if (data.password.length < 8) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe tener al menos 8 caracteres", path: ["password"] });
        }
        if (!/[A-Z]/.test(data.password)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe contener al menos una mayúscula", path: ["password"] });
        }
        if (!/[0-9]/.test(data.password)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe contener al menos un número", path: ["password"] });
        }
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Las contraseñas no coinciden", path: ["confirmPassword"] });
        }
    }
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [historyDate, setHistoryDate] = useState<Date | null>(null);
    const [hasHistory, setHasHistory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Phone split state
    const [phonePrefix, setPhonePrefix] = useState('0412');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<EditProfileForm>({
        resolver: zodResolver(editProfileSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: {
            contactEmail: user?.contactEmail || "",
            accessEmail: user?.email || "",
            address: user?.address || "",
            password: "",
            confirmPassword: "",
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
                        setHasHistory(true);
                    }
                }
            } catch (err) {
                console.error("Could not fetch history metadata", err);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        fetchHistoryMetadata();
    }, []);

    // #5 — Prevent scroll bleed when edit modal is open
    useEffect(() => {
        if (isEditing) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isEditing]);

    if (!user) {
        return null;
    }

    const calculateAge = (birthDate: string | Date | undefined) => {
        if (!birthDate) return null;
        const dob = new Date(birthDate);
        if (isNaN(dob.getTime())) return null;
        const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        if (age < 0 || age > 150) return null;
        return age;
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

            if (!data.contenido || typeof data.contenido !== 'object') {
                throw new Error("La historia clínica no tiene contenido válido.");
            }
            try {
                generateClinicalHistoryPDF(patientData, data.contenido);
            } catch {
                throw new Error("Error al generar el PDF. Contacta al administrador.");
            }
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

    const handleFormSubmit = (e: React.FormEvent) => {
        const isPhoneValid = phoneNumber.length === 7;
        if (!isPhoneValid) setPhoneError("El número de teléfono debe tener 7 dígitos");
        else setPhoneError(null);
        handleSubmit(onSubmit)(e);
    };

    const onSubmit = async (data: EditProfileForm) => {
        if (!phoneNumber || phoneNumber.length !== 7) {
            setPhoneError("El número de teléfono debe tener 7 dígitos");
            return;
        }

        setIsLoading(true);
        setError(null);

        const fullPhone = `${phonePrefix}-${phoneNumber}`;

        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactEmail: data.contactEmail,
                    accessEmail: data.accessEmail,
                    password: data.password || undefined,
                    phone: fullPhone,
                    address: data.address,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Error al actualizar perfil");
            }

            toast.success("Perfil actualizado con éxito");
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
                <div className="flex flex-row gap-3 items-center">
                    {isLoadingHistory ? (
                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider animate-pulse">
                            Verificando historial...
                        </span>
                    ) : hasHistory && historyDate ? (
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Última modificación: {historyDate.toLocaleDateString()}
                        </span>
                    ) : (
                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                            Sin historial disponible
                        </span>
                    )}
                    <button
                        onClick={handleDownloadHistory}
                        disabled={isDownloading || !hasHistory}
                        title={!hasHistory ? "Sin historial clínico disponible aún" : "Descargar historial clínico"}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-md border border-white/80 text-gray-700 font-bold rounded-2xl hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm focus:ring-2 focus:ring-lime-300"
                    >
                        {isDownloading ? <Loader2 size={18} className="animate-spin text-lime-600" /> : <FileDown size={18} className="text-lime-600" />}
                        Descargar Historial Clínico
                    </button>
                    <button
                        onClick={() => {
                            // Parse existing phone: "0412-1362829" → prefix + number
                            const existing = user.phone || '';
                            const dashIdx = existing.indexOf('-');
                            if (dashIdx !== -1) {
                                setPhonePrefix(existing.slice(0, dashIdx));
                                setPhoneNumber(existing.slice(dashIdx + 1));
                            } else if (existing.length >= 4) {
                                setPhonePrefix(existing.slice(0, 4));
                                setPhoneNumber(existing.slice(4));
                            } else {
                                setPhonePrefix('0412');
                                setPhoneNumber(existing);
                            }
                            setPhoneError(null);
                            setIsEditing(true);
                            reset({
                                contactEmail: user.contactEmail || "",
                                accessEmail: user.email || "",
                                address: user.address || "",
                                password: "",
                                confirmPassword: "",
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
                            <div className="h-full w-full rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center text-lime-700 font-black text-4xl shadow-inner border border-white leading-none">
                                {user.firstName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8 sm:px-10">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {user.firstName} {user.lastName}
                    </h2>

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

            {/* Seguros Médicos */}
            {user.patientId && (
                <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
                    <div className="px-8 sm:px-10 py-6 border-b border-white/40 bg-white/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-400/20 flex items-center justify-center">
                                <Shield size={18} className="text-lime-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Seguro Médico</h2>
                                <p className="text-xs text-gray-500">Pólizas vinculadas a tu cuenta</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-8 sm:px-10 py-6">
                        <PatientInsuranceSection pacienteId={user.patientId.toString()} />
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
                    <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-white/40 bg-white/30 backdrop-blur-md flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Editar Perfil</h2>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">Actualiza tus datos personales y de cuenta.</p>
                            </div>
                            <button onClick={() => { setIsEditing(false); setPhoneError(null); }} className="w-9 h-9 bg-white/50 hover:bg-white rounded-full flex items-center justify-center border border-white/60 shadow-sm transition-all text-gray-500 hover:text-gray-800">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrolling Body */}
                        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 custom-scrollbar">
                            <form id="editProfileForm" onSubmit={handleFormSubmit} className="space-y-5">

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-700/90 rounded-2xl flex items-center gap-2 border border-red-200/50 shadow-sm backdrop-blur-md">
                                        <AlertCircle size={20} />
                                        <span className="text-sm font-bold">{error}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Section 1: Datos de Contacto */}
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">1</span>
                                        <h4 className="font-bold text-gray-800 text-base">Datos de Contacto</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={phonePrefix}
                                                    onChange={e => setPhonePrefix(e.target.value)}
                                                    className="w-28 px-3 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 cursor-pointer"
                                                >
                                                    {['0412','0414','0416','0422','0424','0426'].map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 7);
                                                        setPhoneNumber(val);
                                                        if (phoneError && val.length === 7) setPhoneError(null);
                                                    }}
                                                    placeholder="1234567"
                                                    maxLength={7}
                                                    className={`flex-1 min-w-0 px-4 py-3 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 placeholder:text-gray-400 ${phoneError ? "border border-red-400 bg-red-50/30" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}
                                                />
                                            </div>
                                            {phoneError && <p className="text-red-500 text-xs font-bold mt-1">{phoneError}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección</label>
                                            <input
                                                {...register("address")}
                                                className={`w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 ${errors.address ? "border border-red-400 bg-red-50/30" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}
                                            />
                                            {errors.address && <p className="text-red-500 text-xs font-bold mt-1">{errors.address.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Correo de Contacto</label>
                                            <input
                                                {...register("contactEmail")}
                                                className={`w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 ${errors.contactEmail ? "border border-red-400 bg-red-50/30" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}
                                            />
                                            {errors.contactEmail && <p className="text-red-500 text-xs font-bold">{errors.contactEmail.message}</p>}
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
                                                className={`w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 ${errors.accessEmail ? "border border-red-400 bg-red-50/30" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}
                                            />
                                            {errors.accessEmail && <p className="text-red-500 text-xs font-bold">{errors.accessEmail.message}</p>}
                                        </div>
                                        <div className="space-y-2 border-t border-white/50 pt-4">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                {...register("password")}
                                                placeholder="Dejar vacía para no cambiar"
                                                className={`w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 placeholder:text-gray-400 ${errors.password ? "border border-red-400 bg-red-50/30" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}
                                            />
                                            {errors.password && <p className="text-red-500 text-xs font-bold">{errors.password.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                {...register("confirmPassword")}
                                                placeholder="Confirmar nueva contraseña"
                                                className={`w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 placeholder:text-gray-400 ${errors.confirmPassword ? "border border-red-400 bg-red-50/30" : "border border-white/60 bg-white/50 focus:bg-white/80"}`}
                                            />
                                            {errors.confirmPassword && <p className="text-red-500 text-xs font-bold">{errors.confirmPassword.message}</p>}
                                        </div>
                                    </div>
                                </section>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/40 flex justify-end gap-3 shrink-0 bg-white/30 backdrop-blur-md">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setPhoneError(null); }}
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
