
"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
}

export function Modal({ isOpen, onClose, title, children, className = "max-w-2xl", bodyClassName = "p-6" }: ModalProps) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Portal to render outside main DOM hierarchy
    // Ensure document exists (Next.js SSR check)
    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-md transition-opacity"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className={`w-full ${className} bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] 
                                      rounded-t-[2.5rem] sm:rounded-[2.5rem] 
                                      shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] 
                                      border border-white/60 pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/40 shrink-0 bg-white/30 backdrop-blur-md">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/40 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body (Scrollable) */}
                            <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
