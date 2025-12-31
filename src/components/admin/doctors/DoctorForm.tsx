"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Edit, User, CalendarClock } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";
import { ScheduleEditor } from "./ScheduleEditor";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

// Base Schema
const baseSchema = z.object({
    nombres: z.string()
        .min(2, "El nombre es requerido")
        .max(50, "Nombre muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
    apellidos: z.string()
        .min(2, "El apellido es requerido")
        .max(50, "Apellido muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),

    // Split ID Card
    idType: z.enum(["V-", "E-", "J-"]),
    idNumber: z
        .string()
        .min(6, "Mínimo 6 dígitos")
        .max(12, "Máximo 12 dígitos")
        .regex(/^\d+$/, "Solo números"),

    // Split Phone
    phoneCode: z.enum(["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"]),
    phoneNumber: z
        .string()
        .min(7, "Mínimo 7 dígitos")
        .max(7, "Máximo 7 dígitos")
        .regex(/^\d+$/, "Solo números"),

    especialidad: z.string().min(1, "Especialidad requerida"),
    correoInstitucional: z.string().email("Email inválido").optional().or(z.literal("")),
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
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

// Edit Schema (Password optional)
const editSchema = baseSchema.extend({
    password: z.string().optional(),
});

export interface DoctorFormData {
    id?: string; // Employed ID
    nombres: string;
    apellidos: string;
    documentoIdentidad: string;
    telefono?: string;
    especialidad: string;
    correoInstitucional?: string;
    licenciaProfesional?: string;
    numeroColegiatura?: string;
    fechaIngreso?: string;
    email: string;
    activo: boolean;
    estadoLaboral?: string;
    usuarioEstado?: string;
    schedule?: any[];
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
    const [activeTab, setActiveTab] = useState<'data' | 'schedule'>('data');
    const [schedule, setSchedule] = useState<any[]>([]);

    const schema = isEditing ? editSchema : createSchema;
    type FormValues = z.infer<typeof schema>;

    // Helpers
    const splitId = (fullId: string = "") => {
        if (!fullId) return { type: "V-", number: "" };
        const match = fullId.match(/^([VEJ]-)(.*)$/);
        return match ? { type: match[1], number: match[2] } : { type: "V-", number: fullId };
    };

    const splitPhone = (fullPhone: string = "") => {
        const prefixes = ["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"];
        const found = prefixes.find(p => fullPhone.startsWith(p));
        return found ? { code: found, number: fullPhone.replace(found, "") } : { code: "0412-", number: "" };
    };

    const initialId = splitId(initialData?.documentoIdentidad);
    const initialPhone = splitPhone(initialData?.telefono);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: initialData ? {
            ...initialData,
            password: "",
            fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : "",
            idType: initialId.type as any,
            idNumber: initialId.number,
            phoneCode: initialPhone.code as any,
            phoneNumber: initialPhone.number,
        } : {
            activo: true,
            idType: "V-",
            phoneCode: "0412-"
        } as any
    });

    const password = watch("password", "");

    useEffect(() => {
        if (initialData) {
            const currentId = splitId(initialData.documentoIdentidad);
            const currentPhone = splitPhone(initialData.telefono);

            reset({
                ...initialData,
                password: "",
                correoInstitucional: initialData.correoInstitucional || "",
                fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : "",
                idType: currentId.type as any,
                idNumber: currentId.number,
                phoneCode: currentPhone.code as any,
                phoneNumber: currentPhone.number,
            });
        } else {
            reset({ activo: true, idType: "V-", phoneCode: "0412-", correoInstitucional: "" });
        }
    }, [initialData, reset]);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const payload = {
                ...data,
                documentoIdentidad: `${data.idType}${data.idNumber}`,
                telefono: `${data.phoneCode}${data.phoneNumber}`,
                schedule: schedule
            };

            const url = isEditing
                ? `/api/admin/doctors/${initialData?.id}`
                : "/api/admin/doctors";

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al guardar médico");
            }

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

    // Tab Button Helper
    const TabButton = ({ id, label, icon: Icon }: { id: 'data' | 'schedule', label: string, icon: any }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                ? "border-lime-600 text-lime-600 dark:text-lime-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex border-b border-gray-100 dark:border-zinc-800 mb-6">
                <TabButton id="data" label="Datos Personales" icon={User} />
                <TabButton id="schedule" label="Horario Base" icon={CalendarClock} />
            </div>

            {serverError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    {serverError}
                </div>
            )}

            {/* TAB 1: DATA */}
            <div className={activeTab === 'data' ? 'block space-y-6' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Nombres"
                        placeholder="Ej: Juan Carlos"
                        error={errors.nombres?.message}
                        {...register("nombres")}
                    />
                    <FormInput
                        label="Apellidos"
                        placeholder="Ej: Pérez Rodríguez"
                        error={errors.apellidos?.message}
                        {...register("apellidos")}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ID Card Split */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Documento de Identidad
                        </label>
                        <div className="flex gap-2">
                            <div className="w-24">
                                <Select
                                    options={[
                                        { value: "V-", label: "V-" },
                                        { value: "E-", label: "E-" },
                                        { value: "J-", label: "J-" }
                                    ]}
                                    error={errors.idType?.message}
                                    {...register("idType")}
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    {...register("idNumber")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="12345678"
                                />
                            </div>
                        </div>
                        {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber.message}</p>}
                    </div>

                    {/* Phone Split */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Teléfono
                        </label>
                        <div className="flex gap-2">
                            <div className="w-28">
                                <Select
                                    options={[
                                        { value: "0412-", label: "0412" },
                                        { value: "0422-", label: "0422" },
                                        { value: "0414-", label: "0414" },
                                        { value: "0424-", label: "0424" },
                                        { value: "0416-", label: "0416" },
                                        { value: "0426-", label: "0426" }
                                    ]}
                                    error={errors.phoneCode?.message}
                                    {...register("phoneCode")}
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    {...register("phoneNumber")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="1234567"
                                />
                            </div>
                        </div>
                        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
                    </div>
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
                        label="Licencia Profesional"
                        placeholder="L-98765"
                        error={errors.licenciaProfesional?.message}
                        {...register("licenciaProfesional")}
                    />
                    <FormInput
                        label="Nro. Colegiatura"
                        placeholder="MPPS-12345"
                        error={errors.numeroColegiatura?.message}
                        {...register("numeroColegiatura")}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Correo de Contacto"
                        type="email"
                        placeholder="contacto@ejemplo.com"
                        error={errors.correoInstitucional?.message}
                        {...register("correoInstitucional")}
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
                                <Select
                                    {...register("estadoLaboral")}
                                    options={[
                                        { value: "ACTIVO", label: "ACTIVO" },
                                        { value: "VACACIONES", label: "VACACIONES" },
                                        { value: "LICENCIA", label: "LICENCIA" },
                                        { value: "SUSPENDIDO", label: "SUSPENDIDO" },
                                        { value: "RETIRADO", label: "RETIRADO" }
                                    ]}
                                    error={errors.estadoLaboral?.message}
                                />
                            </div>

                            {/* 3. Usuario Estado */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado de Usuario</label>
                                <Select
                                    {...register("usuarioEstado")}
                                    options={[
                                        { value: "ACTIVO", label: "ACTIVO" },
                                        { value: "INACTIVO", label: "INACTIVO" },
                                        { value: "BLOQUEADO", label: "BLOQUEADO" }
                                    ]}
                                    error={errors.usuarioEstado?.message}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Credenciales de Acceso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                            label="Correo de Acceso (Usuario)"
                            type="email"
                            placeholder="usuario@login.com"
                            error={errors.email?.message}
                            {...register("email")}
                        />
                        <div className="space-y-2">
                            <FormInput
                                label={isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                                type="password"
                                placeholder="••••••••"
                                error={errors.password?.message}
                                {...register("password")}
                            />
                            {password && <PasswordStrengthIndicator password={password} />}
                        </div>
                    </div>
                    {isEditing && (
                        <p className="text-xs text-gray-500 mt-2">Dejar la contraseña en blanco para mantener la actual.</p>
                    )}
                </div>
            </div>

            {/* TAB 2: SCHEDULE */}
            <div className={activeTab === 'schedule' ? 'block' : 'hidden'}>
                <ScheduleEditor
                    value={schedule}
                    onChange={setSchedule}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800 mt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                    leftIcon={isEditing ? <Edit className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                >
                    {isEditing ? "Actualizar Todos los Datos" : "Guardar Médico y Horario"}
                </Button>
            </div>
        </form >
    );
}
