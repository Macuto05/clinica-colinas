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
        .max(50, "Nombre muy largo"),
    lastName: z
        .string()
        .min(2, "Apellido debe tener al menos 2 caracteres")
        .max(50, "Apellido muy largo"),
    idCard: z
        .string()
        .min(6, "Cédula inválida")
        .max(15, "Cédula inválida")
        .regex(/^[VEJ0-9-]+$/i, "Formato de cédula inválido"),
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
    phone: z
        .string()
        .min(10, "Teléfono inválido")
        .max(15, "Teléfono inválido")
        .regex(/^[0-9+-\s()]+$/, "Formato de teléfono inválido"),
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
    // Optional fields for role and doctor
    role: z.string().optional(),
    specialty: z.string().optional(),
    collegiateNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
