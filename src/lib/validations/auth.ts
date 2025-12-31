import { z } from "zod";

// Login schema
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Email es requerido")
        .email("Email inválido"),
    password: z
        .string()
        .min(1, "Contraseña es requerida"),
});

// Registration schema
export const registerSchema = z.object({
    firstName: z
        .string()
        .min(2, "Nombre debe tener al menos 2 caracteres")
        .max(50, "Nombre muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
    lastName: z
        .string()
        .min(2, "Apellido debe tener al menos 2 caracteres")
        .max(50, "Apellido muy largo")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),

    // Split ID Card
    idType: z.enum(["V-", "E-", "J-"], {
        required_error: "Tipo es requerido",
    }),
    idNumber: z
        .string()
        .min(6, "Mínimo 6 dígitos")
        .max(12, "Máximo 12 dígitos")
        .regex(/^\d+$/, "Solo números"),

    birthDate: z
        .string()
        .refine((date) => {
            const birthDate = new Date(date);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            return age >= 18 && age <= 120;
        }, "Debe ser mayor de 18 años"),
    email: z
        .string()
        .min(1, "Email es requerido")
        .email("Email inválido"),
    contactEmail: z
        .string()
        .min(1, "Email de contacto es requerido")
        .email("Email de contacto inválido"),
    sex: z
        .string()
        .min(1, "Sexo es requerido"),

    // Split Phone
    phoneCode: z.enum(["0412-", "0414-", "0416-", "0424-", "0426-", "0422-"], {
        required_error: "Código es requerido",
    }),
    phoneNumber: z
        .string()
        .min(7, "Mínimo 7 dígitos")
        .max(7, "Máximo 7 dígitos")
        .regex(/^\d+$/, "Solo números"),

    address: z
        .string()
        .min(10, "Dirección debe tener al menos 10 caracteres")
        .max(200, "Dirección muy larga"),
    password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
        .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z
        .string()
        .min(1, "Confirma tu contraseña"),
    acceptTerms: z
        .boolean()
        .refine((val) => val === true, "Debes aceptar los términos y condiciones"),

    // Optional fields
    role: z.string().optional(),
    specialty: z.string().optional(),
    collegiateNumber: z.string().optional(),
}).transform((data) => ({
    ...data,
    idCard: `${data.idType}${data.idNumber}`,
    phone: `${data.phoneCode}${data.phoneNumber}`
})).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
