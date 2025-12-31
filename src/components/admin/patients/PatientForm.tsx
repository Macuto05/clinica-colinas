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
    estado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO", "FALLECIDO"]).default("ACTIVO"),

    // User related fields
    email: z.string().email("Email de usuario inválido").optional().or(z.literal("")),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]).default("ACTIVO"),
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
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden">
            {/* Header */}


            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <form id="patient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Información Personal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombres */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombres
                                </label>
                                <input
                                    {...register("nombres")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Juan Carlos"
                                />
                                {errors.nombres && <p className="text-red-500 text-xs mt-1">{errors.nombres.message}</p>}
                            </div>

                            {/* Apellidos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Apellidos
                                </label>
                                <input
                                    {...register("apellidos")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Pérez Rodríguez"
                                />
                                {errors.apellidos && <p className="text-red-500 text-xs mt-1">{errors.apellidos.message}</p>}
                            </div>

                            {/* Documento */}
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

                            {/* Fecha Nacimiento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    {...register("fechaNacimiento")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            {/* Sexo */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sexo
                                </label>
                                <Select
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
                    </div>

                    <div className="border-t border-gray-200 dark:border-zinc-700 my-4"></div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Información de Contacto
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Telefono */}
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

                            {/* Correo Contacto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Correo de Contacto
                                </label>
                                <input
                                    {...register("correo")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="contacto@ejemplo.com"
                                />
                                {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>}
                            </div>

                            {/* Direccion */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Dirección
                                </label>
                                <textarea
                                    {...register("direccion")}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                    placeholder="Tu dirección completa"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-zinc-700 my-4"></div>

                    {/* Account & Status Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Cuenta y Estado
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Email Usuario */}
                            <div>
                                <FormInput
                                    label="Correo de Acceso (Usuario)"
                                    placeholder="usuario@login.com"
                                    error={errors.email?.message}
                                    {...register("email")}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <FormInput
                                    label="Contraseña"
                                    type="password"
                                    placeholder={isEditing ? "••••••••" : "Contraseña"}
                                    error={errors.password?.message}
                                    {...register("password")}
                                />
                                {password && <PasswordStrengthIndicator password={password} />}
                            </div>

                            {/* Selects de Estado */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Estado del Paciente
                                </label>
                                <Select
                                    {...register("estado")}
                                    options={[
                                        { value: "ACTIVO", label: "ACTIVO" },
                                        { value: "INACTIVO", label: "INACTIVO" },
                                        { value: "BLOQUEADO", label: "BLOQUEADO" },
                                        { value: "FALLECIDO", label: "FALLECIDO" }
                                    ]}
                                    error={errors.estado?.message}
                                />
                            </div>

                            {/* Estado Usuario */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Estado de Usuario (Acceso)
                                </label>
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
                </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-zinc-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-zinc-800">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    form="patient-form"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    leftIcon={isEditing ? <Edit className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                >
                    {isEditing ? "Guardar Cambios" : "Guardar Paciente"}
                </Button>
            </div>
        </div>
    );
}
