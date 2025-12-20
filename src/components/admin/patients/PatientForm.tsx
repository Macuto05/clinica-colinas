import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";

// Schema for Patient
const patientSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "Documento requerido"),
    fechaNacimiento: z.string().optional(), // We'll handle date as string YYYY-MM-DD
    sexo: z.string().optional(),
    telefono: z.string().optional(),
    correo: z.string().email("Correo inválido").optional().or(z.literal("")),
    direccion: z.string().optional(),
    estado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO", "FALLECIDO"]).default("ACTIVO"),

    // User related fields (for existing users mostly)
    email: z.string().email("Email de usuario inválido").optional().or(z.literal("")),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]).default("ACTIVO"),
    password: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
    initialData?: any; // We'll refine this type
    onClose: () => void;
    onSuccess?: () => void;
}

export default function PatientForm({ initialData, onClose, onSuccess }: PatientFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!initialData;

    const defaultValues: Partial<PatientFormData> = {
        nombres: initialData?.nombres || "",
        apellidos: initialData?.apellidos || "",
        documentoIdentidad: initialData?.documentoIdentidad || "",
        fechaNacimiento: initialData?.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0] : "",
        sexo: initialData?.sexo || "",
        telefono: initialData?.telefono || "",
        correo: initialData?.correo || "",
        direccion: initialData?.direccion || "",
        estado: initialData?.estado || "ACTIVO",
        email: initialData?.usuario?.email || "",
        usuarioEstado: initialData?.usuario?.estado || "ACTIVO",
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: defaultValues as any,
    });

    const onSubmit = async (data: PatientFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const url = isEditing
                ? `/api/admin/patients/${initialData.pacienteId}`
                : `/api/admin/patients`;

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditing ? "Editar Paciente" : "Nuevo Paciente"}
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                    <X className="w-5 h-5" />
                </button>
            </div>

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
                                    Nombres <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register("nombres")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Juan Andrés"
                                />
                                {errors.nombres && <p className="text-red-500 text-xs mt-1">{errors.nombres.message}</p>}
                            </div>

                            {/* Apellidos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Apellidos <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register("apellidos")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Pérez López"
                                />
                                {errors.apellidos && <p className="text-red-500 text-xs mt-1">{errors.apellidos.message}</p>}
                            </div>

                            {/* Documento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Documento de Identidad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register("documentoIdentidad")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: 12345678"
                                />
                                {errors.documentoIdentidad && <p className="text-red-500 text-xs mt-1">{errors.documentoIdentidad.message}</p>}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sexo
                                </label>
                                <select
                                    {...register("sexo")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="MASCULINO">Masculino</option>
                                    <option value="FEMENINO">Femenino</option>
                                    <option value="OTRO">Otro</option>
                                </select>
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
                                <input
                                    {...register("telefono")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: +58 414 1234567"
                                />
                            </div>

                            {/* Correo Contacto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Correo (Contacto)
                                </label>
                                <input
                                    {...register("correo")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="ejemplo@correo.com"
                                />
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
                                    placeholder="Dirección completa"
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
                            {/* Email Usuario (Si existe usuario asociado) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email de Usuario
                                    <span className="ml-1 text-xs text-gray-400 font-normal">(Vinculado a la cuenta de acceso)</span>
                                </label>
                                <input
                                    {...register("email")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="usuario@sistema.com"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            {/* Password - Only for new users or password reset */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contraseña
                                    <span className="ml-1 text-xs text-gray-400 font-normal">
                                        {isEditing ? "(Dejar vacío para mantener actual)" : "(Requerido para nuevos usuarios)"}
                                    </span>
                                </label>
                                <input
                                    type="password"
                                    {...register("password")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder={isEditing ? "••••••••" : "Contraseña"}
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                            </div>

                            {/* Selects de Estado */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Estado del Paciente
                                </label>
                                <select
                                    {...register("estado")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="ACTIVO">ACTIVO</option>
                                    <option value="INACTIVO">INACTIVO</option>
                                    <option value="BLOQUEADO">BLOQUEADO</option>
                                    <option value="FALLECIDO">FALLECIDO</option>
                                </select>
                            </div>

                            {/* Estado Usuario */}
                            {/* Only show if user exists or we are creating one. For now simplest logic. */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Estado de Usuario (Acceso)
                                </label>
                                <select
                                    {...register("usuarioEstado")}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="ACTIVO">ACTIVO</option>
                                    <option value="INACTIVO">INACTIVO</option>
                                    <option value="BLOQUEADO">BLOQUEADO</option>
                                </select>
                            </div>

                        </div>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-zinc-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    form="patient-form"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
