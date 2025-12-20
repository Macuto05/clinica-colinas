
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { updateDoctor } from "@/app/actions/doctors";

interface DoctorEditFormProps {
    doctor: {
        id: number;
        imageUrl?: string | null;
        license?: string | null;
        biography?: string | null;
        user: {
            name: string;
            email: string;
        };
        speciality: {
            name: string;
        };
    };
}

export default function DoctorEditForm({ doctor }: DoctorEditFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        imageUrl: doctor.imageUrl || "",
        license: doctor.license || "",
        biography: doctor.biography || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await updateDoctor(doctor.id, formData);
            if (result.success) {
                alert("Doctor actualizado correctamente");
                router.refresh();
                router.push("/admin/doctores");
            } else {
                alert("Error al actualizar");
            }
        } catch (error) {
            console.error(error);
            alert("Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/doctores"
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Editar Doctor
                        </h1>
                        <p className="text-gray-500">{doctor.user.name}</p>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-lime-700 disabled:opacity-50 transition"
                >
                    <Save className="h-4 w-4" />
                    {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Image Preview */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Foto de Perfil</h3>
                        <div className="flex flex-col items-center">
                            <div className="mb-6 h-48 w-48 overflow-hidden rounded-full border-4 border-lime-100 dark:border-lime-900/30">
                                {formData.imageUrl ? (
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                        onError={(e) => (e.currentTarget.src = "")} // Fallback if broken link
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-6xl">
                                        👨‍⚕️
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-xs text-gray-500">
                                Copia y pega la URL de la imagen (ej: /images/doctors/foto.jpg)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form Fields */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
                        {/* Read Only Info */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={doctor.user.name}
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 shadow-sm sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Especialidad
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={doctor.speciality.name}
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 shadow-sm sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                URL de la Foto (Ruta local o HTTPS)
                            </label>
                            <input
                                type="text"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="/images/doctors/mi-foto.jpg"
                                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-lime-500 focus:ring-lime-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Número de Licencia (CM / MSAS)
                            </label>
                            <input
                                type="text"
                                value={formData.license}
                                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-lime-500 focus:ring-lime-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Biografía / Experiencia
                            </label>
                            <textarea
                                rows={4}
                                value={formData.biography}
                                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-lime-500 focus:ring-lime-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white sm:text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
