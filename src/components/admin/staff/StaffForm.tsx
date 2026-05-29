import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Edit } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

const staffSchema = z.object({
    nombres: z.string()
        .min(2, "Nombre debe tener al menos 2 caracteres")
        .max(50, "Nombre muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
    apellidos: z.string()
        .min(2, "Apellido debe tener al menos 2 caracteres")
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
    correoInstitucional: z.string().email("Email inválido").optional().or(z.literal("")),
    fechaIngreso: z.string().optional(),
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

    useEffect(() => {
        if (initialData) {
            const id = splitId(initialData.documentoIdentidad);
            const phone = splitPhone(initialData.telefono);
            reset({
                ...initialData,
                password: "",
                rolId: initialData.usuario?.rolId?.toString() || "",
                usuarioEstado: initialData.usuario?.estado || "ACTIVO",
                email: initialData.usuario?.email || "",
                fechaIngreso: initialData.fechaIngreso ? new Date(initialData.fechaIngreso).toISOString().split('T')[0] : "",
                idType: id.type,
                idNumber: id.number,
                phoneCode: phone.code,
                phoneNumber: phone.number,
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (data: StaffFormData) => {
        setIsLoading(true);
        setServerError(null);

        if (!isEditing && (!data.password || data.password.length < 6)) {
            setServerError("La contraseña es requerida y debe tener al menos 6 caracteres");
            setIsLoading(false);
            return;
        }

        try {
            const url = isEditing
                ? `/api/admin/staff/${initialData.empleadoId}`
                : "/api/admin/staff";

            const payload = {
                ...data,
                documentoIdentidad: `${data.idType}${data.idNumber}`,
                telefono: `${data.phoneCode}${data.phoneNumber}`,
            };

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Error al guardar empleado");

            onSuccess();
        } catch (error: any) {
            setServerError(error.message || "Error inesperado");
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

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex p-6 gap-0">
                    {/* ─── Left panel: Personal Info ─── */}
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
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-white/40 self-stretch mx-0" />

                    {/* ─── Right panel: Credentials ─── */}
                    <div className="flex-1 pl-8 space-y-5 min-w-0">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Credenciales de Acceso
                        </h3>

                        <Select
                            label="Rol del Empleado"
                            {...register("rolId")}
                            placeholder="Seleccione un rol..."
                            options={roles.map((rol) => ({ value: rol.id, label: rol.nombre }))}
                            error={errors.rolId?.message}
                        />

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
                                    Estados
                                </h3>
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
                    isLoading={isLoading}
                    disabled={isLoading}
                    onClick={handleSubmit(onSubmit)}
                    leftIcon={isEditing ? <Edit className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                >
                    {isEditing ? "Actualizar Empleado" : "Guardar Empleado"}
                </Button>
            </div>
        </div>
    );
}
