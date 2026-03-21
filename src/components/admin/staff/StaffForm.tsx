import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Edit } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

// Schema
const staffSchema = z.object({
    nombres: z.string()
        .min(2, "Nombre debe tener al menos 2 caracteres")
        .max(50, "Nombre muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
    apellidos: z.string()
        .min(2, "Apellido debe tener al menos 2 caracteres")
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

    correoInstitucional: z.string().email("Email inválido").optional().or(z.literal("")),
    fechaIngreso: z.string().optional(),

    // User / Role
    rolId: z.string().min(1, "El rol es requerido"),
    email: z.string().email("Email de usuario requerido"),
    password: z.string().optional(),
    estadoLaboral: z.enum(["ACTIVO", "VACACIONES", "LICENCIA", "SUSPENDIDO", "RETIRADO"]).optional(),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]).optional(),
});

export type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    roles: { id: string; nombre: string }[];
    initialData?: any;
}

export default function StaffForm({ onSuccess, onCancel, roles, initialData }: StaffFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const isEditing = !!initialData;

    // Helper to split valid ID/Phone if editing
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
    } = useForm<StaffFormData>({
        resolver: zodResolver(staffSchema),
        mode: "onChange",
        defaultValues: initialData ? {
            ...initialData,
            password: "",
            rolId: initialData.usuario?.rolId?.toString() || "",
            usuarioEstado: initialData.usuario?.estado || "ACTIVO",
            email: initialData.usuario?.email || "",
            fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : "",
            idType: initialId.type as any,
            idNumber: initialId.number,
            phoneCode: initialPhone.code as any,
            phoneNumber: initialPhone.number,
        } : {
            estadoLaboral: "ACTIVO",
            usuarioEstado: "ACTIVO",
            idType: "V-",
            phoneCode: "0412-"
        }
    });

    const password = watch("password", "");

    // Effect to reset if initialData changes (vital for modals)
    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                password: "",
                rolId: initialData.usuario?.rolId?.toString() || "",
                usuarioEstado: initialData.usuario?.estado || "ACTIVO",
                email: initialData.usuario?.email || "",
                fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : "",
                idType: splitId(initialData.documentoIdentidad).type,
                idNumber: splitId(initialData.documentoIdentidad).number,
                phoneCode: splitPhone(initialData.telefono).code,
                phoneNumber: splitPhone(initialData.telefono).number,
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

            const payload = {
                ...data,
                documentoIdentidad: `${data.idType}${data.idNumber}`,
                telefono: `${data.phoneCode}${data.phoneNumber}`,
            };

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al guardar empleado");
            }


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
                <FormInput
                    label="Correo de Contacto"
                    type="email"
                    placeholder="contacto@ejemplo.com"
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

            {isEditing && (
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Estados y Disponibilidad</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* 1. Empleado Estado Laboral */}
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

                <div className="grid grid-cols-1 gap-4 mb-4">
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

            <div className="flex justify-end gap-3 pt-4">
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
                    {isEditing ? "Actualizar Empleado" : "Guardar Empleado"}
                </Button>
            </div>
        </form>
    );
}
