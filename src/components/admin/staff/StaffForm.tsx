"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";

// Schema
const staffSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "CI/DNI requerido"),
    telefono: z.string().optional(),
    correoInstitucional: z.string().email("Email inválido").optional().or(z.literal("")),
    fechaIngreso: z.string().optional(),

    // User / Role
    rolId: z.string().min(1, "El rol es requerido"),
    email: z.string().email("Email de usuario requerido"),
    password: z.string().optional(), // Make optional here, refine later or handle in submit
    estadoLaboral: z.enum(["ACTIVO", "VACACIONES", "LICENCIA", "SUSPENDIDO", "RETIRADO"]).default("ACTIVO"),
});

export type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    roles: { id: string; nombre: string }[];
    initialData?: any; // Allow initial data for editing
}

export default function StaffForm({ onSuccess, onCancel, roles, initialData }: StaffFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const isEditing = !!initialData;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<StaffFormData>({
        resolver: zodResolver(staffSchema),
        defaultValues: initialData ? {
            ...initialData,
            password: "", // Security: don't prefill password
            rolId: initialData.usuario?.rolId?.toString() || "", // Extract role from relation
            email: initialData.usuario?.email || "",
            fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : ""
        } : {
            estadoLaboral: "ACTIVO"
        }
    });

    // Effect to reset if initialData changes (vital for modals)
    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                password: "",
                rolId: initialData.usuario?.rolId?.toString() || "",
                email: initialData.usuario?.email || "",
                fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : ""
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (data: StaffFormData) => {
        setIsLoading(true);
        setServerError(null);

        // Client-side validation for password on CREATE
        if (!isEditing && (!data.password || data.password.length < 6)) {
            setServerError("La contraseña es requerida y debe tener al menos 6 caracteres");
            setIsLoading(false);
            return;
        }

        try {
            const url = isEditing
                ? `/api/admin/staff/${initialData.empleadoId}`
                : "/api/admin/staff";

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al guardar empleado");
            }

            alert(isEditing ? "Empleado actualizado exitosamente" : "Empleado registrado exitosamente");
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Nombres"
                    placeholder="Ej. María"
                    error={errors.nombres?.message}
                    {...register("nombres")}
                />
                <FormInput
                    label="Apellidos"
                    placeholder="Ej. Rodríguez"
                    error={errors.apellidos?.message}
                    {...register("apellidos")}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Documento ID (CI/DNI)"
                    placeholder="Ej. 12345678"
                    error={errors.documentoIdentidad?.message}
                    {...register("documentoIdentidad")}
                />
                <FormInput
                    label="Teléfono"
                    placeholder="Ej. +58 412 1234567"
                    error={errors.telefono?.message}
                    {...register("telefono")}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Correo Institucional"
                    type="email"
                    placeholder="empleado@clinica.com"
                    error={errors.correoInstitucional?.message}
                    {...register("correoInstitucional")}
                />
                <FormInput
                    label="Fecha de Ingreso"
                    type="date"
                    error={errors.fechaIngreso?.message}
                    {...register("fechaIngreso")}
                />
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Credenciales de Acceso</h3>

                <div className="grid grid-cols-1 gap-4 mb-4">
                    {/* Role Selection kept here as it's related to access, but maybe move out or keep? 
                        User explicitly asked for Email/Password section to look like DoctorForm. 
                        DoctorForm puts "Credenciales de Acceso" specifically for Email/Pass. 
                        Let's keep Role here but change the header to "Rol y Acceso" or split? 
                        User wants "Credenciales de Acceso" look for email/pass. 
                        Let's put Role in a separate "Rol del Empleado" section or just keep it above.
                        Let's just change the labels and add the helper text as requested.
                     */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rol del Empleado</label>
                        <select
                            {...register("rolId")}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="">Seleccione un rol...</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                            ))}
                        </select>
                        {errors.rolId && <p className="text-sm text-red-500">{errors.rolId.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Email"
                        type="email"
                        placeholder="empleado@clinica.com"
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
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isEditing ? "Actualizar Empleado" : "Guardar Empleado"}
                </button>
            </div>
        </form>
    );
}
