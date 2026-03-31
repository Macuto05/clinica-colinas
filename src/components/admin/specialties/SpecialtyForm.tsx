"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Edit, AlertCircle } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";
import { Button } from "@/components/ui/Button";

const specialtySchema = z.object({
    nombre: z.string().min(3, "El nombre es obligatorio (min 3)"),
    descripcion: z.string().optional(),
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
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<SpecialtyFormData>({
        resolver: zodResolver(specialtySchema),
        defaultValues: initialData || { activa: true },
    });

    const activa = watch("activa");

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
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Messages */}
                    {error && (
                        <div className="p-4 bg-red-50/50 backdrop-blur-md text-red-700 rounded-2xl text-sm border border-red-200/50 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {error}
                        </div>
                    )}

                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Información de Especialidad
                        </h3>

                        {/* Nombre */}
                        <FormInput
                            label="Nombre de la Especialidad"
                            placeholder="Ej: Cardiología"
                            error={errors.nombre?.message}
                            {...register("nombre")}
                        />

                        {/* Descripción */}
                        <FormInput
                            label="Descripción"
                            placeholder="Breve descripción de la especialidad..."
                            error={errors.descripcion?.message}
                            {...register("descripcion")}
                        />

                        {/* Activa Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Estado de Especialidad</span>
                                <span className="text-xs text-gray-400">{activa ? "La especialidad está actualmente activa" : "La especialidad está inactiva"}</span>
                            </div>
                            <div
                                className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${activa ? 'bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.4)]' : 'bg-gray-200'}`}
                                onClick={() => setValue("activa", !activa, { shouldDirty: true })}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${activa ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </section>
                </form>
            </div>

            {/* Footer */}
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
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    onClick={handleSubmit(onSubmit)}
                    leftIcon={isEditing ? <Edit className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                >
                    {isEditing ? "Actualizar Especialidad" : "Guardar Especialidad"}
                </Button>
            </div>
        </div>
    );
}
