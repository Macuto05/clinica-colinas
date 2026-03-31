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
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {serverError && (
                        <div className="p-4 bg-red-50/50 backdrop-blur-md text-red-700 rounded-2xl text-sm border border-red-200/50 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {serverError}
                        </div>
                    )}

                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Información Personal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* ID Card Split */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider ml-1">
                                    Documento de Identidad
                                </label>
                                <div className="flex gap-3">
                                    <div className="w-28">
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
                                        <FormInput
                                            {...register("idNumber")}
                                            placeholder="12345678"
                                            error={errors.idNumber?.message}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Phone Split */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider ml-1">
                                    Teléfono
                                </label>
                                <div className="flex gap-3">
                                    <div className="w-32">
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
                                        <FormInput
                                            {...register("phoneNumber")}
                                            placeholder="1234567"
                                            error={errors.phoneNumber?.message}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                    </section>

                    {isEditing && (
                        <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                                Estados Laborales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </section>
                    )}

                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Credenciales de Acceso
                        </h3>

                        <div className="grid grid-cols-1 gap-6 mb-6">
                            <Select
                                label="Rol del Empleado"
                                {...register("rolId")}
                                placeholder="Seleccione un rol..."
                                options={roles.map((rol) => ({ value: rol.id, label: rol.nombre }))}
                                error={errors.rolId?.message}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {isEditing ? "Actualizar Empleado" : "Guardar Empleado"}
                </Button>
            </div>
        </div>
    );
}
