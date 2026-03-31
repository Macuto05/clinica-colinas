"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Edit } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";
import { Button } from "@/components/ui/Button";

// Schema
const roleSchema = z.object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(50, "Máximo 50 caracteres"),
    descripcion: z.string().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
    activo: z.boolean().optional()
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
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {serverError && (
                        <div className="p-4 bg-red-50/50 backdrop-blur-md text-red-700 rounded-2xl text-sm border border-red-200/50 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {serverError}
                        </div>
                    )}

                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Información del Rol
                        </h3>

                        <FormInput
                            label="Nombre"
                            placeholder="Ej. ENFERMERIA"
                            error={errors.nombre?.message}
                            {...register("nombre")}
                        />

                        <FormInput
                            label="Descripción"
                            placeholder="Descripción opcional del rol..."
                            error={errors.descripcion?.message}
                            {...register("descripcion")}
                        />

                        <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Estado del Rol</span>
                                <span className="text-xs text-gray-400">{activo ? "El rol está actualmente activo" : "El rol está inactivo"}</span>
                            </div>
                            <div
                                className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${activo ? 'bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.4)]' : 'bg-gray-200'}`}
                                onClick={() => setValue("activo", !activo, { shouldDirty: true })}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </section>
                </form>
            </div>

            <div className="bg-white/30 backdrop-blur-md px-6 py-6 flex items-center justify-end gap-3 border-t border-white/40 mt-4 rounded-b-[2.5rem]">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                    onClick={handleSubmit(onSubmit)}
                    leftIcon={isEditing ? <Edit className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                >
                    {isEditing ? "Actualizar Rol" : "Guardar Rol"}
                </Button>
            </div>
        </div>
    );
}
