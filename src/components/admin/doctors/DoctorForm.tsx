"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Edit } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { validatePassword } from "@/lib/validations/password";

const baseSchema = z.object({
    nombres: z.string()
        .min(2, "El nombre es requerido")
        .max(50, "Nombre muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
    apellidos: z.string()
        .min(2, "El apellido es requerido")
        .max(50, "Apellido muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),
    idType: z.enum(["V-", "E-", "J-"]),
    idNumber: z
        .string()
        .min(6, "Mínimo 6 dígitos")
        .max(12, "Máximo 12 dígitos")
        .regex(/^\d+$/, "Solo números"),
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

const createSchema = baseSchema.extend({
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .refine(p => /[A-Z]/.test(p), "La contraseña debe tener al menos una letra mayúscula")
        .refine(p => /[0-9]/.test(p), "La contraseña debe tener al menos un número"),
});

const editSchema = baseSchema.extend({
    password: z.string().optional(),
});

export interface DoctorFormData {
    id?: string;
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

    const schema = isEditing ? editSchema : createSchema;
    type FormValues = z.infer<typeof schema>;

    const splitId = (fullId: string | null | undefined) => {
        const id = fullId ?? "";
        if (!id) return { type: "V-", number: "" };
        const match = id.match(/^([VEJ]-)(.*)$/);
        return match ? { type: match[1], number: match[2] } : { type: "V-", number: id };
    };

    const splitPhone = (fullPhone: string | null | undefined) => {
        const phone = fullPhone ?? "";
        const prefixes = ["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"];
        const found = prefixes.find(p => phone.startsWith(p));
        return found ? { code: found, number: phone.replace(found, "") } : { code: "0412-", number: "" };
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
            correoInstitucional: initialData.correoInstitucional || "",
            fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : "",
            idType: initialId.type as any,
            idNumber: initialId.number,
            phoneCode: initialPhone.code as any,
            phoneNumber: initialPhone.number,
        } : {
            activo: true,
            idType: "V-",
            phoneCode: "0412-",
            correoInstitucional: "",
        } as any
    });

    const password = watch("password", "");

    useEffect(() => {
        if (initialData) {
            const id = splitId(initialData.documentoIdentidad);
            const phone = splitPhone(initialData.telefono);
            reset({
                ...initialData,
                password: "",
                correoInstitucional: initialData.correoInstitucional || "",
                fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : "",
                idType: id.type as any,
                idNumber: id.number,
                phoneCode: phone.code as any,
                phoneNumber: phone.number,
            });
        } else {
            reset({ activo: true, idType: "V-", phoneCode: "0412-", correoInstitucional: "" } as any);
        }
    }, [initialData, reset]);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setServerError(null);
        try {
            const payload = {
                ...data,
                documentoIdentidad: `${data.idType}${data.idNumber}`,
                telefono: `${data.phoneCode}${data.phoneNumber}`
            };

            const url = isEditing
                ? `/api/admin/doctors/${initialData?.id}`
                : "/api/admin/doctors";

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Error al guardar médico");

            onSuccess();
        } catch (error) {
            setServerError(error instanceof Error ? error.message : "Ha ocurrido un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col">
            {serverError && (
                <div className="mx-6 mt-6 p-3 bg-red-50/50 backdrop-blur-md text-red-700 rounded-2xl text-sm border border-red-200/50 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    {serverError}
                </div>
            )}

            <form id="doctor-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex p-6 gap-0">
                    {/* ─── Left panel: Información Personal ─── */}
                    <div className="flex-1 pr-8 space-y-5 min-w-0">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Información Personal
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider ml-1">
                                    Documento de Identidad
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-24 flex-shrink-0">
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
                                    <div className="flex-1 min-w-0">
                                        <FormInput
                                            {...register("idNumber")}
                                            placeholder="12345678"
                                            error={errors.idNumber?.message}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider ml-1">
                                    Teléfono
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-24 flex-shrink-0">
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
                                    <div className="flex-1 min-w-0">
                                        <FormInput
                                            {...register("phoneNumber")}
                                            placeholder="1234567"
                                            error={errors.phoneNumber?.message}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Especialidad"
                                placeholder="Seleccione una especialidad"
                                {...register("especialidad")}
                                options={specialties.map(s => ({ value: s.id, label: s.nombre }))}
                                error={errors.especialidad?.message}
                            />
                            <FormInput
                                label="Fecha de Ingreso"
                                type="date"
                                error={errors.fechaIngreso?.message}
                                {...register("fechaIngreso")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="Correo de Contacto"
                                type="email"
                                placeholder="contacto@ejemplo.com"
                                error={errors.correoInstitucional?.message}
                                {...register("correoInstitucional")}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-white/40 self-stretch" />

                    {/* ─── Right panel: Credenciales ─── */}
                    <div className="flex-1 pl-8 space-y-5 min-w-0">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Credenciales de Acceso
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="border-t border-white/40 pt-5 space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    Estados y Disponibilidad
                                </h3>

                                <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60">
                                    <div className="flex flex-col">
                                        <label htmlFor="activo" className="text-xs font-bold text-gray-700 uppercase tracking-tight">Perfil Activo</label>
                                        <p className="text-[10px] text-gray-500 font-medium tracking-tight">Citas habilitadas</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="activo"
                                        {...register("activo")}
                                        className="w-5 h-5 accent-lime-500 rounded-md"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label="Estado Laboral"
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
                                    <Select
                                        label="Estado de Usuario"
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
                        )}
                    </div>
                </div>
            </form>

            <div className="border-t border-white/40 bg-white/20 backdrop-blur-md px-6 py-4 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    form="doctor-form"
                    isLoading={isLoading}
                    disabled={isLoading}
                    leftIcon={isEditing ? <Edit className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                >
                    {isEditing ? "Actualizar Perfil" : "Guardar Médico"}
                </Button>
            </div>
        </div>
    );
}
