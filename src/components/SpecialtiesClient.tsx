"use client";

/**
 * Specialties Client Component
 * 
 * Handles the interactive UI for specialties display.
 * Receives data from Server Component as props.
 */

import { motion } from "framer-motion";
import Link from "next/link";

interface Specialty {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
}

interface SpecialtiesClientProps {
    specialties: Specialty[];
}

export default function SpecialtiesClient({ specialties }: SpecialtiesClientProps) {
    return (
        <section id="specialties" className="py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Nuestras Especialidades
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                        Contamos con {specialties.length} especialidades médicas para atender todas tus necesidades de salud.
                    </p>
                </div>

                <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {specialties.map((specialty, index) => (
                        <Link
                            href={`/especialidades`}
                            key={specialty.id}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
                            >
                                {/* Icon */}
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl shadow-lg transition-transform duration-300 group-hover:scale-110">
                                    {specialty.icon || '🏥'}
                                </div>

                                {/* Name */}
                                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                                    {specialty.name}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                                    {specialty.description || 'Atención médica especializada'}
                                </p>

                                {/* Hover Arrow */}
                                <div className="mt-4 flex items-center text-sm font-medium text-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-blue-400">
                                    Ver más
                                    <svg className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <Link
                        href="/especialidades"
                        className="inline-flex items-center rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Ver Todas las Especialidades
                        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
