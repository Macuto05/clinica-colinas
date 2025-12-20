import { Check, X } from "lucide-react";
import { getPasswordStrength, validatePassword } from "@/lib/validations/password";

interface PasswordStrengthIndicatorProps {
    password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const { requirements } = validatePassword(password);
    const { strength, score } = getPasswordStrength(password);

    if (!password) return null;

    const getStrengthColor = () => {
        switch (strength) {
            case "weak": return "bg-red-500";
            case "medium": return "bg-yellow-500";
            case "strong": return "bg-green-500";
        }
    };

    const getStrengthText = () => {
        switch (strength) {
            case "weak": return "Débil";
            case "medium": return "Media";
            case "strong": return "Fuerte";
        }
    };

    return (
        <div className="space-y-3 mt-2">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Fortaleza</span>
                    <span className="font-medium capitalize">{getStrengthText()}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(score / 5) * 100}%` }}
                    />
                </div>
            </div>

            {/* Requirements List */}
            <ul className="space-y-1">
                {requirements.map((req, index) => (
                    <li
                        key={index}
                        className={`text-xs flex items-center gap-2 transition-colors duration-200 ${req.met ? "text-green-600" : "text-gray-400"
                            }`}
                    >
                        {req.met ? (
                            <Check size={12} className="stroke-[3]" />
                        ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-300" />
                        )}
                        {req.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}
