import React from "react";

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className = "", ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={`w-full rounded-2xl border bg-white/50 backdrop-blur-md px-4 py-3 text-sm font-medium outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                            ${error
                                ? "border-red-400/50 bg-red-50/30 focus:border-red-500 focus:ring-red-400/20"
                                : "border-white/60 hover:border-white/80 focus:ring-4 focus:ring-lime-400/20 focus:bg-white/80 focus:border-lime-500/30 shadow-inner"
                            }
                            ${className}
                        `}
                        {...props}
                    >
                        {placeholder && <option value="" className="bg-white text-gray-500">{placeholder}</option>}
                        {options.map((option) => (
                            <option key={option.value} value={option.value} className="bg-white text-gray-900 font-medium">
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                {error && <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";
