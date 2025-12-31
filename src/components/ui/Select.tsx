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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400
                            ${error
                                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-500"
                            }
                            ${className}
                        `}
                        {...props}
                    >
                        {placeholder && <option value="">{placeholder}</option>}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";
