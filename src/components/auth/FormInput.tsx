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
                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        suppressHydrationWarning
                        type={isPassword ? (showPassword ? "text" : "password") : type}
                        className={`
                            w-full px-5 py-3 rounded-2xl border bg-white/50 backdrop-blur-md transition-all duration-300
                            ${icon ? "pl-11" : ""}
                            ${isPassword ? "pr-11" : ""}
                            focus:outline-none focus:ring-4 focus:ring-lime-400/20 focus:bg-white/80 focus:border-lime-500/30
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${error
                                ? "border-red-400/50 bg-red-50/30 focus:border-red-500 focus:ring-red-400/20"
                                : "border-white/60 hover:border-white/80 shadow-inner"
                            }
                            text-sm font-medium text-gray-900 placeholder:text-gray-400/80
                            ${className}
                        `}
                        {...props}
                    />
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/80 pointer-events-none">
                            {icon}
                        </div>
                    )}

                    {isPassword && (
                        <button
                            type="button"
                            suppressHydrationWarning
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-10 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}

                    {error && (
                        <div className={`absolute top-1/2 -translate-y-1/2 text-red-500/80 pointer-events-none ${isPassword ? "right-12" : "right-4"}`}>
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
