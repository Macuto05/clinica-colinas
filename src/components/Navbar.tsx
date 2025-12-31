"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Phone, MapPin, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { name: "Especialidades", href: "/especialidades" },
        { name: "Médicos", href: "/medicos" },
        { name: "Artículos", href: "/articulos" },
        { name: "Sobre Nosotros", href: "/nosotros" },
        { name: "Contacto", href: "/contacto" },
    ];

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                scrolled
                    ? "bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 dark:bg-zinc-900/80 dark:border-zinc-800"
                    : "bg-transparent py-2"
            )}
        >
            {/* Top bar - Hidden on scroll for cleaner look */}
            <div className={cn(
                "transition-all duration-300 overflow-hidden border-b border-gray-100/10 dark:border-gray-800/10",
                scrolled ? "h-0 opacity-0" : "h-10 opacity-100"
            )}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-10 items-center justify-end gap-6 text-sm">
                        <Link href="/contacto" className="flex items-center gap-2 text-gray-600 transition-all hover:text-[#a1db4b] hover:scale-105 dark:text-gray-400">
                            <Phone className="h-3.5 w-3.5" />
                            Llamar
                        </Link>
                        <Link href="/contacto" className="flex items-center gap-2 text-gray-600 transition-all hover:text-[#a1db4b] hover:scale-105 dark:text-gray-400">
                            <MapPin className="h-3.5 w-3.5" />
                            Ubicación
                        </Link>
                        {user ? (
                            <Link
                                href={
                                    user.role === 'ADMIN' ? '/admin' :
                                        user.role === 'DOCTOR' ? '/dashboard/doctor' :
                                            user.role === 'ALMACEN' ? '/almacen' :
                                                ['CAJA', 'CAJA Y FACTURACION', 'CAJA Y FACTURACIÓN', 'CAJA/FACTURACION', 'CAJA/FACTURACIÓN'].includes(user.role?.toUpperCase() || "") ? '/caja' :
                                                    '/dashboard/perfil'
                                }
                                className="flex items-center gap-2 text-gray-600 transition-all hover:text-[#a1db4b] hover:scale-105 dark:text-gray-400"
                            >
                                <User className="h-3.5 w-3.5" />
                                {user.name?.split(' ')[0]}
                            </Link>
                        ) : (
                            <Link href="/login" className="flex items-center gap-2 text-gray-600 transition-all hover:text-[#a1db4b] hover:scale-105 dark:text-gray-400">
                                <User className="h-3.5 w-3.5" />
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main navbar */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group flex-shrink-0">
                        <div className="relative h-16 w-44 transition-transform group-hover:scale-105">
                            <Image
                                src="/logo-clinicas-colina.jpg"
                                alt="Clínicas Colina"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex flex-1 items-center justify-center">
                        <div className="flex items-center gap-1 rounded-full bg-white/50 px-2 py-1 backdrop-blur-md border border-white/20 shadow-sm dark:bg-zinc-800/50 dark:border-zinc-700">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="relative px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:text-[#a1db4b] dark:text-gray-300 group"
                                >
                                    {item.name}
                                    <span className="absolute inset-x-0 bottom-0 h-0.5 w-0 bg-[#a1db4b] transition-all duration-300 group-hover:w-full" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Reserve Button */}
                    <Link
                        href="/dashboard/citas"
                        className="hidden lg:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#a1db4b] to-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-lime-500/30 transition-all hover:shadow-lime-500/50 hover:scale-105 hover:-translate-y-0.5 active:scale-95"
                    >
                        <Calendar className="h-4 w-4" />
                        Reservar hora
                    </Link>

                    {/* Mobile menu button */}
                    <div className="flex lg:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center rounded-xl p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white/95 backdrop-blur-xl dark:bg-zinc-900/95"
                    >
                        <div className="space-y-1 px-4 pb-6 pt-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-[#a1db4b]/10 hover:text-[#a1db4b] dark:text-gray-300"
                                >
                                    {item.name}
                                </Link>
                            ))}

                            <div className="pt-4">
                                <Link
                                    href="/dashboard/citas"
                                    onClick={() => setIsOpen(false)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a1db4b] to-teal-500 px-5 py-3 text-base font-bold text-white shadow-lg"
                                >
                                    <Calendar className="h-5 w-5" />
                                    Reservar hora
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
