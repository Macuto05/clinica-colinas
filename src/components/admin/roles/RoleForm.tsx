"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Edit } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";

// Schema
const roleSchema = z.object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(50, "Máximo 50 caracteres"),
    descripcion: z.string().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
    activo: z.boolean().default(true)
});

export type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: any;
}

export default function RoleForm({ onSuccess, onCancel, initialData }: RoleFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const isEditing = !!initialData;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue
    } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: initialData || {
            nombre: "",
            descripcion: "",
            activo: true
        }
    });

    const activo = watch("activo");

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const onSubmit = async (data: RoleFormData) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const url = isEditing
                ? `/api/admin/roles/${initialData.rolId}`
                : "/api/admin/roles";

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al guardar el rol");
            }


            onSuccess();
        } catch (error: any) {
            setServerError(error.message || "Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                    {serverError}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input
                    {...register("nombre")}
                    placeholder="Ej. ENFERMERIA"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                />
                {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                    {...register("descripcion")}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all resize-none"
                    placeholder="Descripción opcional del rol..."
                />
                {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion.message}</p>}
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800">
                <div
                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${activo ? 'bg-lime-600' : 'bg-gray-300 dark:bg-zinc-600'}`}
                    onClick={() => setValue("activo", !activo, { shouldDirty: true })}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${activo ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {activo ? "Rol Activo" : "Rol Inactivo (No disponible)"}
                </span>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium text-sm"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-medium text-sm transition-colors"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar
                </button>
            </div>
        </form>
    );
}
