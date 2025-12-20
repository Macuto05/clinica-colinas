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
    activo: z.boolean().optional().default(true)
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
        reset
    } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: initialData || {
            nombre: "",
            descripcion: "",
            activo: true
        }
    });

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
                ? `/api/admin/roles/${initialData.rolId}` // Assuming rolId is BigInt serialized or string
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

            alert(isEditing ? "Rol actualizado" : "Rol creado");
            onSuccess();
        } catch (error: any) {
            setServerError(error.message || "Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    {serverError}
                </div>
            )}

            <div className="space-y-4">
                <FormInput
                    label="Nombre del Rol"
                    placeholder="Ej. ENFERMERIA"
                    error={errors.nombre?.message}
                    {...register("nombre")}
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                    <textarea
                        {...register("descripcion")}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        placeholder="Descripción opcional del rol..."
                    />
                    {errors.descripcion && <p className="text-sm text-red-500">{errors.descripcion.message}</p>}
                </div>

                <div className="flex items-start gap-2 pt-2">
                    <div className="flex items-center h-5">
                        <input
                            type="checkbox"
                            id="activo"
                            {...register("activo")}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                        />
                    </div>
                    <div className="ml-2 text-sm">
                        <label htmlFor="activo" className="font-medium text-gray-900 dark:text-gray-300">Rol Activo</label>
                        <p className="text-gray-500 text-xs">Si se desactiva, no aparecerá disponible para nuevos empleados.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isEditing ? "Actualizar Rol" : "Guardar Rol"}
                </button>
            </div>
        </form>
    );
}
