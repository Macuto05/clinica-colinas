"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
    "Equipo médico altamente calificado",
    "Tecnología de diagnóstico avanzada",
    "Atención personalizada y humana",
    "Instalaciones modernas y confortables",
];

export default function About() {
    return (
        <section id="about" className="py-24 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] bg-gradient-to-b from-lime-50/50 to-transparent rounded-full blur-3xl opacity-50 dark:from-lime-900/10" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative aspect-square overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl dark:border-zinc-900">
                            {/* Placeholder for About Image */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-lime-100 to-teal-50 dark:from-lime-900/20 dark:to-teal-900/20">
                                <span className="text-gray-400 font-medium">Imagen Institucional</span>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-[#a1db4b]/20 blur-3xl" />
                        <div className="absolute -top-10 -right-10 -z-10 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative rounded-3xl border border-gray-100 bg-white/50 p-8 shadow-xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50 lg:p-12">
                            <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#a1db4b] to-teal-500 opacity-10 blur-2xl" />

                            <h2 className="relative text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                                <span className="block text-[#a1db4b] text-lg font-semibold uppercase tracking-wider mb-2">Nuestra Trayectoria</span>
                                Más de 20 años cuidando de tu salud
                            </h2>

                            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                En Clínica Colinas, nos dedicamos a proporcionar atención médica de excelencia. Nuestra misión es mejorar la calidad de vida de nuestros pacientes a través de un servicio compasivo y profesional.
                            </p>

                            <ul className="mt-8 space-y-4">
                                {features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <span className="text-gray-700 font-medium dark:text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-10 flex flex-wrap gap-6 border-t border-gray-100 pt-8 dark:border-gray-800">
                                <div>
                                    <p className="text-4xl font-bold text-[#a1db4b]">20+</p>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Años de Experiencia</p>
                                </div>
                                <div className="w-px bg-gray-200 dark:bg-gray-800" />
                                <div>
                                    <p className="text-4xl font-bold text-teal-500">50k+</p>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Pacientes Atendidos</p>
                                </div>
                            </div>

                            <div className="mt-10">
                                <Link
                                    href="/nosotros"
                                    className="inline-flex items-center gap-2 text-[#a1db4b] font-bold hover:text-[#8bc34a] transition-colors group"
                                >
                                    Conoce más sobre nosotros
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
