import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Save, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/auth/FormInput";
import { Select } from "@/components/ui/Select";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

const basePatientSchema = z.object({
    nombres: z
        .string()
        .min(2, "Nombre debe tener al menos 2 caracteres")
        .max(50, "Nombre muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
    apellidos: z
        .string()
        .min(2, "Apellido debe tener al menos 2 caracteres")
        .max(50, "Apellido muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),
    idType: z.enum(["V-", "E-", "J-"]),
    idNumber: z
        .string()
        .min(6, "Mínimo 6 dígitos")
        .max(12, "Máximo 12 dígitos")
        .regex(/^\d+$/, "Solo números"),
    fechaNacimiento: z.string().optional(),
    sexo: z.string().optional(),
    phoneCode: z.enum(["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"]),
    phoneNumber: z
        .string()
        .min(7, "Mínimo 7 dígitos")
        .max(7, "Máximo 7 dígitos")
        .regex(/^\d+$/, "Solo números"),
    correo: z.string().email("Correo inválido").optional().or(z.literal("")),
    direccion: z.string().optional(),
    estado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO", "FALLECIDO"]).optional(),
    email: z.string().email("Email de usuario inválido").optional().or(z.literal("")),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]).optional(),
    password: z.string().optional(),
});

const createPatientSchema = basePatientSchema.superRefine((data, ctx) => {
    if (data.email && !data.password) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña es requerida cuando se proporciona el correo de acceso", path: ["password"] });
    }
    if (data.password) {
        if (data.password.length < 8)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mínimo 8 caracteres", path: ["password"] });
        if (!/[A-Z]/.test(data.password))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe tener al menos una letra mayúscula", path: ["password"] });
        if (!/[0-9]/.test(data.password))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe tener al menos un número", path: ["password"] });
    }
});

const editPatientSchema = basePatientSchema;

type PatientFormData = z.infer<typeof basePatientSchema>;

interface PatientFormProps {
    initialData?: any;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function PatientForm({ initialData, onClose, onSuccess }: PatientFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        watch,
        reset,
    } = useForm<PatientFormData>({
        resolver: zodResolver(isEditing ? editPatientSchema : createPatientSchema),
        defaultValues: {
            nombres: initialData?.nombres || "",
            apellidos: initialData?.apellidos || "",
            idType: initialId.type as any,
            idNumber: initialId.number,
            fechaNacimiento: initialData?.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0] : "",
            sexo: initialData?.sexo || "",
            phoneCode: initialPhone.code as any,
            phoneNumber: initialPhone.number,
            correo: initialData?.correo || "",
            direccion: initialData?.direccion || "",
            estado: initialData?.estado || "ACTIVO",
            email: initialData?.usuario?.email || "",
            usuarioEstado: initialData?.usuario?.estado || "ACTIVO",
            password: "",
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (initialData) {
            const id = splitId(initialData.documentoIdentidad);
            const phone = splitPhone(initialData.telefono);
            reset({
                nombres: initialData.nombres || "",
                apellidos: initialData.apellidos || "",
                idType: id.type as any,
                idNumber: id.number,
                fechaNacimiento: initialData.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0] : "",
                sexo: initialData.sexo || "",
                phoneCode: phone.code as any,
                phoneNumber: phone.number,
                correo: initialData.correo || "",
                direccion: initialData.direccion || "",
                estado: initialData.estado || "ACTIVO",
                email: initialData.usuario?.email || "",
                usuarioEstado: initialData.usuario?.estado || "ACTIVO",
                password: "",
            });
        }
    }, [initialData, reset]);

    const password = watch("password", "");

    const onSubmit = async (data: PatientFormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const url = isEditing
                ? `/api/admin/patients/${initialData.pacienteId}`
                : `/api/admin/patients`;

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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al guardar paciente");
            }

            router.refresh();
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col">
            {error && (
                <div className="mx-6 mt-6 p-3 bg-red-50/50 backdrop-blur-md text-red-700 rounded-2xl text-sm border border-red-200/50 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    {error}
                </div>
            )}

            <form id="patient-form" onSubmit={handleSubmit(onSubmit)}>
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

                            <FormInput
                                label="Fecha de Nacimiento"
                                type="date"
                                error={errors.fechaNacimiento?.message}
                                {...register("fechaNacimiento")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Sexo"
                                options={[
                                    { value: "MASCULINO", label: "Masculino" },
                                    { value: "FEMENINO", label: "Femenino" },
                                    { value: "OTRO", label: "Otro" }
                                ]}
                                placeholder="Seleccionar..."
                                error={errors.sexo?.message}
                                {...register("sexo")}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-white/40 self-stretch" />

                    {/* ─── Right panel: Contacto & Acceso ─── */}
                    <div className="flex-1 pl-8 space-y-5 min-w-0">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Contacto & Acceso
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
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

                            <FormInput
                                label="Correo de Contacto"
                                type="email"
                                placeholder="contacto@ejemplo.com"
                                error={errors.correo?.message}
                                {...register("correo")}
                            />
                        </div>

                        <FormInput
                            label="Dirección"
                            placeholder="Tu dirección completa..."
                            error={errors.direccion?.message}
                            {...register("direccion")}
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
                                    label="Contraseña"
                                    type="password"
                                    placeholder={isEditing ? "Dejar en blanco para mantener" : "••••••••"}
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
                                        label="Estado del Paciente"
                                        options={[
                                            { value: "ACTIVO", label: "ACTIVO" },
                                            { value: "INACTIVO", label: "INACTIVO" },
                                            { value: "BLOQUEADO", label: "BLOQUEADO" },
                                            { value: "FALLECIDO", label: "FALLECIDO" }
                                        ]}
                                        error={errors.estado?.message}
                                        {...register("estado")}
                                    />
                                    <Select
                                        label="Estado de Usuario"
                                        options={[
                                            { value: "ACTIVO", label: "ACTIVO" },
                                            { value: "INACTIVO", label: "INACTIVO" },
                                            { value: "BLOQUEADO", label: "BLOQUEADO" }
                                        ]}
                                        error={errors.usuarioEstado?.message}
                                        {...register("usuarioEstado")}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </form>

            <div className="border-t border-white/40 bg-white/20 backdrop-blur-md px-6 py-4 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    form="patient-form"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    leftIcon={isEditing ? <Edit className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                >
                    {isEditing ? "Guardar Cambios" : "Guardar Paciente"}
                </Button>
            </div>
        </div>
    );
}
