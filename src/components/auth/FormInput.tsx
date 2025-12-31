import { InputHTMLAttributes, forwardRef, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, helperText, icon, className = "", type, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === "password";

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        type={isPassword ? (showPassword ? "text" : "password") : type}
                        className={`
                            w-full px-4 py-2 rounded-lg border bg-white/50 backdrop-blur-sm transition-all duration-200
                            ${icon ? "pl-10" : ""}
                            ${isPassword ? "pr-10" : ""}
                            focus:outline-none focus:ring-2 focus:ring-offset-0
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${error
                                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                : "border-gray-200 focus:border-primary-500 focus:ring-primary-100 hover:border-gray-300"
                            }
                            ${className}
                        `}
                        {...props}
                    />
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            {icon}
                        </div>
                    )}

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}

                    {error && (
                        <div className={`absolute top-1/2 -translate-y-1/2 text-red-500 pointer-events-none ${isPassword ? "right-10" : "right-3"}`}>
                            <AlertCircle size={18} />
                        </div>
                    )}
                </div>
                {error ? (
                    <p className="mt-1 text-sm text-red-500 animate-in slide-in-from-top-1">
                        {error}
                    </p>
                ) : helperText ? (
                    <p className="mt-1 text-sm text-gray-500">{helperText}</p>
                ) : null}
            </div>
        );
    }
);

FormInput.displayName = "FormInput";
