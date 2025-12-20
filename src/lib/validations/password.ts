// Password validation utilities

export interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
    met?: boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
    {
        label: "Mínimo 8 caracteres",
        test: (password: string) => password.length >= 8,
    },
    {
        label: "Al menos una letra mayúscula",
        test: (password: string) => /[A-Z]/.test(password),
    },
    {
        label: "Al menos un número",
        test: (password: string) => /[0-9]/.test(password),
    },
];

export function validatePassword(password: string): {
    isValid: boolean;
    requirements: PasswordRequirement[];
} {
    const requirements = PASSWORD_REQUIREMENTS.map(req => ({
        ...req,
        met: req.test(password),
    }));

    const isValid = requirements.every(req => req.met);

    return { isValid, requirements };
}

export function getPasswordStrength(password: string): {
    strength: 'weak' | 'medium' | 'strong';
    score: number;
} {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // Special chars

    if (score <= 2) return { strength: 'weak', score };
    if (score <= 4) return { strength: 'medium', score };
    return { strength: 'strong', score };
}
