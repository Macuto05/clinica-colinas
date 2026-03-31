import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

        const variants = {
            primary: "bg-lime-500/95 border border-lime-400/40 text-white shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-sm hover:bg-lime-500 hover:shadow-[0_8px_24px_rgba(132,204,22,0.4)] focus:ring-lime-400/30",
            secondary: "bg-white/60 border border-white/50 text-gray-700 shadow-sm backdrop-blur-sm hover:bg-white/80 focus:ring-gray-400/20",
            outline: "bg-white/40 border border-white/60 text-gray-700 shadow-sm backdrop-blur-sm hover:bg-white/60 focus:ring-gray-400/10",
            ghost: "bg-transparent hover:bg-white/40 text-gray-700",
            danger: "bg-red-500/95 border border-red-400/40 text-white shadow-[0_8px_20px_rgba(239,68,68,0.3)] backdrop-blur-sm hover:bg-red-500 hover:shadow-[0_8px_24px_rgba(239,68,68,0.4)] focus:ring-red-400/30",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 text-sm",
            lg: "h-12 px-6 text-base",
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={disabled || isLoading}
                suppressHydrationWarning={true}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = "Button";
