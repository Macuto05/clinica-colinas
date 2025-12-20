
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle, CheckCircle, Save, Edit } from "lucide-react";

const specialtySchema = z.object({
    nombre: z.string().min(3, "El nombre es obligatorio (min 3)"),
    descripcion: z.string().optional(),
    icono: z.string().optional(),
    activa: z.boolean().optional(),
});

export type SpecialtyFormData = z.infer<typeof specialtySchema> & { id?: string };

interface SpecialtyFormProps {
    initialData?: SpecialtyFormData;
    onSuccess: () => void;
    onCancel: () => void;
}

export function SpecialtyForm({ initialData, onSuccess, onCancel }: SpecialtyFormProps) {
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!initialData;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SpecialtyFormData>({
        resolver: zodResolver(specialtySchema),
        defaultValues: initialData || { activa: true },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ activa: true });
        }
    }, [initialData, reset]);

    const onSubmit: SubmitHandler<SpecialtyFormData> = async (data) => {
        setError(null);
        try {
            const url = isEditing
                ? `/api/admin/specialties/${initialData?.id}`
                : "/api/admin/specialties";

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al guardar la especialidad");
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Messages */}
            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-4">
                {/* Nombre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre de la Especialidad
                    </label>
                    <input
                        {...register("nombre")}
                        type="text"
                        placeholder="Ej: Cardiología"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                    />
                    {errors.nombre && (
                        <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
                    )}
                </div>

                {/* Icono */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Icono (Emoji o Texto corto)
                    </label>
                    <input
                        {...register("icono")}
                        type="text"
                        maxLength={5}
                        placeholder="Ej: 🫀"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all font-emoji"
                    />
                    <p className="text-xs text-gray-500 mt-1">Usa un emoji representativo.</p>
                </div>

                {/* Descripción */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descripción
                    </label>
                    <textarea
                        {...register("descripcion")}
                        rows={3}
                        placeholder="Breve descripción..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                    />
                </div>

                {/* Activa Checkbox (For both create and edit, though defaulting to true on create) */}
                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="activa"
                        {...register("activa")}
                        className="w-4 h-4 text-lime-600 bg-gray-100 border-gray-300 rounded focus:ring-lime-500"
                    />
                    <label htmlFor="activa" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        Especialidad Activa
                    </label>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            {isEditing ? <Edit size={16} /> : <CheckCircle size={16} />}
                            {isEditing ? "Actualizar Especialidad" : "Guardar Especialidad"}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
