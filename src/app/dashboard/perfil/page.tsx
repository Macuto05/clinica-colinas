"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Edit2, Lock, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/auth/FormInput"; // Assuming we can reuse this or simple inputs

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
    const { user, refreshUser } = useAuth(); // Assuming refreshUser exists, if not we might need to reload window or implement it
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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

    if (!user) {
        return null;
    }

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
            if (refreshUser) refreshUser(); // Optimistic update or refresh
            else window.location.reload();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
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
                    className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
                >
                    <Edit2 size={16} />
                    Editar Perfil
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="relative h-32 bg-gradient-to-r from-lime-500 to-lime-600">
                    <div className="absolute -bottom-12 left-8">
                        <div className="h-24 w-24 rounded-full bg-white dark:bg-zinc-900 p-1">
                            <div className="h-full w-full rounded-full bg-lime-100 dark:bg-zinc-800 flex items-center justify-center text-lime-600 font-bold text-3xl border-4 border-white">
                                {user.firstName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        {/* Personal Info - READ ONLY */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2">
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
                            </div>
                        </div>

                        {/* Contact Info - EDITABLE via Modal, Read Only here */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2">
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">Editar Perfil</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Datos de Contacto</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Teléfono</label>
                                        <input
                                            {...register("phone")}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Dirección</label>
                                        <input
                                            {...register("address")}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-sm font-medium">Correo de Contacto</label>
                                        <input
                                            {...register("contactEmail")}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-500">Para notificaciones y resultados.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold text-gray-900">Seguridad y Acceso</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Correo de Acceso (Login)</label>
                                        <input
                                            {...register("accessEmail")}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Nueva Contraseña (Opcional)</label>
                                            <input
                                                type="password"
                                                {...register("password")}
                                                placeholder="Dejar vacía para no cambiar"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                                            />
                                            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                {...register("confirmPassword")}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                                            />
                                            {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading ? "Guardando..." : (
                                        <>
                                            <Save size={18} /> Guardar Cambios
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function BioItem({ icon: Icon, label, value }: { icon: any, label: string, value?: string | null }) {
    return (
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <div className="h-10 w-10 rounded-full bg-lime-50 dark:bg-zinc-800 flex items-center justify-center text-lime-600">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-medium">{value || "No registrado"}</p>
            </div>
        </div>
    );
}
