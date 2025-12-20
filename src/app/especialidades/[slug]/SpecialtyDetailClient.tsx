"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Data types matching what we pass from the server component
interface Doctor {
    id: number;
    name: string;
    credentials: string;
    experience: string;
    imageUrl?: string | null;
}

interface Specialty {
    id: string;
    name: string;
    icon: string;
    description: string;
    fullDescription: string;
}

interface SpecialtyDetailClientProps {
    specialty: Specialty;
    doctors: Doctor[];
}

export default function SpecialtyDetailClient({ specialty, doctors }: SpecialtyDetailClientProps) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-lime-50 to-green-50 dark:from-zinc-900 dark:to-black pt-32 pb-12">
                <div className="absolute top-0 left-0 -z-10 h-full w-full">
                    <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-lime-200 opacity-20 blur-3xl" />
                    <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-green-200 opacity-20 blur-3xl" />
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link
                            href="/especialidades"
                            className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a especialidades
                        </Link>

                        <div className="mt-8 flex items-center gap-4">
                            <div className="text-6xl">{specialty.icon}</div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                    {specialty.name}
                                </h1>
                                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                                    {specialty.description}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-zinc-800"
                            >
                                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                                    ¿Qué realizamos en {specialty.name}?
                                </h2>
                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {specialty.fullDescription}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Doctors Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mt-8"
                            >
                                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                                    Nuestros Especialistas
                                </h2>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    {doctors.map((doctor, index) => (
                                        <Link
                                            key={doctor.id}
                                            href={`/doctores/${doctor.id}`}
                                            className="block"
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + index * 0.05 }}
                                                className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-lime-500 hover:shadow-lg dark:border-gray-800 dark:bg-zinc-800 dark:hover:border-lime-500"
                                            >
                                                <div className="p-6">
                                                    {/* Doctor Photo Placeholder */}
                                                    {/* Doctor Photo */}
                                                    <div className="mb-4 flex justify-center">
                                                        {doctor.imageUrl ? (
                                                            <img
                                                                src={doctor.imageUrl}
                                                                alt={doctor.name}
                                                                className="h-24 w-24 rounded-full object-cover shadow-md border-2 border-white dark:border-zinc-700"
                                                            />
                                                        ) : (
                                                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-lime-100 to-green-100 text-4xl dark:from-lime-900/30 dark:to-green-900/30">
                                                                👨‍⚕️
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                        {doctor.name}
                                                    </h3>
                                                    <p className="mt-2 text-sm font-medium text-lime-600 dark:text-lime-400">
                                                        {doctor.credentials}
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                        {doctor.experience}
                                                    </p>

                                                    <div className="mt-4 text-sm font-semibold text-lime-600 hover:underline dark:text-lime-400">
                                                        Ver perfil completo →
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>

                                {doctors.length === 0 && (
                                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-zinc-800">
                                        <div className="text-5xl mb-4">👨‍⚕️</div>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Actualmente no hay especialistas disponibles en esta área.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="sticky top-24 space-y-6"
                            >
                                {/* Quick Actions */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-zinc-800">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                        Acciones Rápidas
                                    </h3>
                                    <div className="space-y-3">
                                        <Link
                                            href="/registro"
                                            className="flex w-full items-center justify-center rounded-lg bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-lime-700"
                                        >
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Agendar Cita
                                        </Link>
                                        <Link
                                            href="/contacto"
                                            className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-zinc-800"
                                        >
                                            <MapPin className="mr-2 h-4 w-4" />
                                            Ubicación
                                        </Link>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="rounded-2xl border border-lime-200 bg-lime-50 p-6 dark:border-lime-900 dark:bg-lime-900/10">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400">
                                        <Award className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                                        Atención de Excelencia
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Todos nuestros especialistas cuentan con certificación vigente y están comprometidos con tu bienestar.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
