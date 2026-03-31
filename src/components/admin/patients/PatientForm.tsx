import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Save, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/auth/FormInput";
import { Select } from "@/components/ui/Select";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

// Localized & Robust Schema matching Public Registration
const patientSchema = z.object({
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

    // Split ID Card
    idType: z.enum(["V-", "E-", "J-"]),
    idNumber: z
        .string()
        .min(6, "Mínimo 6 dígitos")
        .max(12, "Máximo 12 dígitos")
        .regex(/^\d+$/, "Solo números"),

    fechaNacimiento: z.string().optional(), // We'll handle validation logic in refinement or UI if needed
    sexo: z.string().optional(),

    // Split Phone
    phoneCode: z.enum(["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"]),
    phoneNumber: z
        .string()
        .min(7, "Mínimo 7 dígitos")
        .max(7, "Máximo 7 dígitos")
        .regex(/^\d+$/, "Solo números"),

    correo: z.string().email("Correo inválido").optional().or(z.literal("")),
    direccion: z.string().optional(),
    estado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO", "FALLECIDO"]).optional(),

    // User related fields
    email: z.string().email("Email de usuario inválido").optional().or(z.literal("")),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]).optional(),
    password: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

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

    // Helper to split valid ID/Phone if editing
    const splitId = (fullId: string = "") => {
        if (!fullId) return { type: "V-", number: "" };
        const match = fullId.match(/^([VEJ]-)(.*)$/);
        return match ? { type: match[1], number: match[2] } : { type: "V-", number: fullId };
    };

    const splitPhone = (fullPhone: string = "") => {
        // Simple logic looking for known prefixes, defaults to 0412 if not found or empty
        const prefixes = ["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"];
        const found = prefixes.find(p => fullPhone.startsWith(p));
        return found ? { code: found, number: fullPhone.replace(found, "") } : { code: "0412-", number: "" };
    };

    const initialId = splitId(initialData?.documentoIdentidad);
    const initialPhone = splitPhone(initialData?.telefono);

    const defaultValues: Partial<PatientFormData> = {
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
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: defaultValues as any,
        mode: "onChange",
    });

    // Effect to seed form when initialData changes
    useEffect(() => {
        if (initialData) {
            const currentId = splitId(initialData.documentoIdentidad);
            const currentPhone = splitPhone(initialData.telefono);

            reset({
                ...initialData,
                nombres: initialData.nombres || "",
                apellidos: initialData.apellidos || "",
                idType: currentId.type as any,
                idNumber: currentId.number,
                fechaNacimiento: initialData.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0] : "",
                sexo: initialData.sexo || "",
                phoneCode: currentPhone.code as any,
                phoneNumber: currentPhone.number,
                correo: initialData.correo || "",
                direccion: initialData.direccion || "",
                estado: initialData.estado || "ACTIVO",
                email: initialData.usuario?.email || "",
                usuarioEstado: initialData.usuario?.estado || "ACTIVO",
                password: "",
            });
        }
    }, [initialData, reset]);

    const password = watch("password", ""); // Watch for strength indicator

    const onSubmit = async (data: PatientFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const url = isEditing
                ? `/api/admin/patients/${initialData.pacienteId}`
                : `/api/admin/patients`;

            const method = isEditing ? "PUT" : "POST";

            // Transform data to match API expectations
            const payload = {
                ...data,
                documentoIdentidad: `${data.idType}${data.idNumber}`,
                telefono: `${data.phoneCode}${data.phoneNumber}`,
                // Remove temporary fields if API is strict, but usually safe to send extra
            };

            const response = await fetch(url, {
                method,
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
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Header - Usually provided by Modal but kept as spacing here if needed */}

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                <form id="patient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {error && (
                        <div className="p-4 bg-red-50/50 backdrop-blur-md text-red-700 rounded-2xl text-sm border border-red-200/50 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {error}
                        </div>
                    )}

                    {/* Personal Information */}
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
                            {/* Documento Identification Split */}
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

                            <FormInput
                                label="Fecha de Nacimiento"
                                type="date"
                                error={errors.fechaNacimiento?.message}
                                {...register("fechaNacimiento")}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                    </section>

                    {/* Contact Information */}
                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Información de Contacto
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                            <FormInput
                                label="Correo de Contacto"
                                type="email"
                                placeholder="contacto@ejemplo.com"
                                error={errors.correo?.message}
                                {...register("correo")}
                            />
                        </div>

                        <div className="mt-6">
                            <FormInput
                                label="Dirección"
                                placeholder="Tu dirección completa..."
                                error={errors.direccion?.message}
                                {...register("direccion")}
                            />
                        </div>
                    </section>

                    {/* Account & Status Information */}
                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Cuenta y Estado
                        </h3>

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
                                    label="Contraseña"
                                    type="password"
                                    placeholder={isEditing ? "Dejar en blanco para mantener" : "••••••••"}
                                    error={errors.password?.message}
                                    {...register("password")}
                                />
                                {password && <PasswordStrengthIndicator password={password} />}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                                label="Estado de Usuario (Acceso)"
                                options={[
                                    { value: "ACTIVO", label: "ACTIVO" },
                                    { value: "INACTIVO", label: "INACTIVO" },
                                    { value: "BLOQUEADO", label: "BLOQUEADO" }
                                ]}
                                error={errors.usuarioEstado?.message}
                                {...register("usuarioEstado")}
                            />
                        </div>
                    </section>
                </form>
            </div>

            {/* Footer */}
            <div className="bg-white/30 backdrop-blur-md px-6 py-6 flex items-center justify-end gap-3 border-t border-white/40 mt-4 rounded-b-[2.5rem]">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
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
