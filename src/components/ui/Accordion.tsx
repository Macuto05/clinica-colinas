"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export function AccordionItem({ title, children, defaultOpen = false, className = "" }: AccordionItemProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div className={`border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden mb-2 ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors text-left"
            >
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">
                    {title}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>
            {isOpen && (
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-700 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
