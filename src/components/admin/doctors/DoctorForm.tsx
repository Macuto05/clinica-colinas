
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Edit } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";

// Base Schema
const baseSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "CI/DNI requerido"),
    telefono: z.string().optional(),
    especialidad: z.string().min(1, "Especialidad requerida"),
    licenciaProfesional: z.string().optional(),
    numeroColegiatura: z.string().optional(),
    fechaIngreso: z.string().optional(),
    email: z.string().email("Email inválido"),
    activo: z.boolean().optional(),
    estadoLaboral: z.string().optional(),
    usuarioEstado: z.string().optional(),
});

// Create Schema (Password required)
const createSchema = baseSchema.extend({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Edit Schema (Password optional)
const editSchema = baseSchema.extend({
    password: z.string().optional().refine(val => !val || val.length >= 6, {
        message: "Si se cambia, debe tener al menos 6 caracteres"
    }),
});

export interface DoctorFormData {
    id?: string; // Employed ID
    nombres: string;
    apellidos: string;
    documentoIdentidad: string;
    telefono?: string;
    especialidad: string;
    licenciaProfesional?: string;
    numeroColegiatura?: string;
    fechaIngreso?: string;
    email: string;
    activo: boolean;
    estadoLaboral?: string;
    usuarioEstado?: string;
}

interface DoctorFormProps {
    initialData?: DoctorFormData;
    onSuccess: () => void;
    onCancel: () => void;
    specialties: { id: string; nombre: string }[];
}

export function DoctorForm({ initialData, onSuccess, onCancel, specialties }: DoctorFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const isEditing = !!initialData;

    const schema = isEditing ? editSchema : createSchema;
    type FormValues = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            ...initialData,
            password: "", // Always empty for security
            // Ensure dates are formatted correctly for input type="date"
            fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : ""
        } : {
            activo: true
        }
    });

    // Reset form when initialData changes (important for modal reuse)
    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                password: "",
                fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : ""
            });
        } else {
            reset({ activo: true });
        }
    }, [initialData, reset]);


    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const url = isEditing
                ? `/api/admin/doctors/${initialData?.id}`
                : "/api/admin/doctors";

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al guardar médico");
            }

            // Success
            alert(isEditing ? "Médico actualizado exitosamente" : "Médico creado exitosamente");
            onSuccess();
        } catch (error) {
            if (error instanceof Error) {
                setServerError(error.message);
            } else {
                setServerError("Ha ocurrido un error inesperado");
            }
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Nombres"
                    placeholder="Juan Carlos"
                    error={errors.nombres?.message}
                    {...register("nombres")}
                />
                <FormInput
                    label="Apellidos"
                    placeholder="Pérez López"
                    error={errors.apellidos?.message}
                    {...register("apellidos")}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Documento ID (CI/DNI)"
                    placeholder="12345678"
                    error={errors.documentoIdentidad?.message}
                    {...register("documentoIdentidad")}
                />
                <FormInput
                    label="Teléfono"
                    placeholder="+58 412 1234567"
                    error={errors.telefono?.message}
                    {...register("telefono")}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad</label>
                    <select
                        {...register("especialidad")}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                    >
                        <option value="">Seleccione una especialidad</option>
                        {specialties.map((spec) => (
                            <option key={spec.id} value={spec.id}>
                                {spec.nombre}
                            </option>
                        ))}
                    </select>
                    {errors.especialidad && (
                        <p className="text-sm text-red-500">{errors.especialidad.message}</p>
                    )}
                </div>
                <FormInput
                    label="Fecha de Ingreso"
                    type="date"
                    error={errors.fechaIngreso?.message}
                    {...register("fechaIngreso")}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Nro. Colegiatura"
                    placeholder="MPPS-12345"
                    error={errors.numeroColegiatura?.message}
                    {...register("numeroColegiatura")}
                />
                <FormInput
                    label="Licencia Profesional"
                    placeholder="L-98765"
                    error={errors.licenciaProfesional?.message}
                    {...register("licenciaProfesional")}
                />
            </div>

            {/* Status Fields (only for edit) */}
            {isEditing && (
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Estados y Disponibilidad</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* 1. Medico Activo Checkbox */}
                        <div className="flex items-start gap-2 pt-2">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    {...register("activo")}
                                    className="w-4 h-4 text-lime-600 bg-gray-100 border-gray-300 rounded focus:ring-lime-500"
                                />
                            </div>
                            <div className="ml-2 text-sm">
                                <label htmlFor="activo" className="font-medium text-gray-900 dark:text-gray-300">Perfil Médico Activo</label>
                                <p className="text-gray-500 text-xs">Habilita/Deshabilita al doctor en el sistema de citas.</p>
                            </div>
                        </div>

                        {/* 2. Empleado Estado Laboral */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado Laboral</label>
                            <select
                                {...register("estadoLaboral")}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                            >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="VACACIONES">VACACIONES</option>
                                <option value="LICENCIA">LICENCIA</option>
                                <option value="SUSPENDIDO">SUSPENDIDO</option>
                                <option value="RETIRADO">RETIRADO</option>
                            </select>
                        </div>

                        {/* 3. Usuario Estado */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado de Usuario</label>
                            <select
                                {...register("usuarioEstado")}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                            >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="INACTIVO">INACTIVO</option>
                                <option value="BLOQUEADO">BLOQUEADO</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Credenciales de Acceso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Email"
                        type="email"
                        placeholder="doctor@clinica.com"
                        error={errors.email?.message}
                        {...register("email")}
                    />
                    <FormInput
                        label={isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                        type="password"
                        placeholder="••••••••"
                        error={errors.password?.message}
                        {...register("password")}
                    />
                </div>
                {isEditing && (
                    <p className="text-xs text-gray-500 mt-2">Dejar la contraseña en blanco para mantener la actual.</p>
                )}
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
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-lime-600 rounded-lg hover:bg-lime-700 focus:ring-4 focus:ring-lime-100 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? <Edit className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
                    {isEditing ? "Actualizar Médico" : "Guardar Médico"}
                </button>
            </div>
        </form>
    );
}
