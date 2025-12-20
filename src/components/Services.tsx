"use client";

import { motion } from "framer-motion";
import { Heart, TestTube, Droplet, Ambulance, BedDouble, Scissors } from "lucide-react";
import Link from "next/link";

// Servicios REALES de la clínica (SOLO presencial, NO teleconsultas)
const services = [
    {
        title: "Consulta Externa",
        description: "Atención médica presencial en todas nuestras especialidades con doctores altamente calificados.",
        icon: Heart,
        color: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-100 dark:bg-teal-900/30",
        gradient: "from-teal-50/90 to-white/90 dark:from-teal-900/20 dark:to-zinc-900/90",
        border: "group-hover:border-teal-200 dark:group-hover:border-teal-800",
        shadow: "group-hover:shadow-teal-500/20"
    },
    {
        title: "Banco de Sangre",
        description: "Banco de sangre completo para transfusiones y procedimientos quirúrgicos con los más altos estándares de calidad.",
        icon: Droplet,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/30",
        gradient: "from-red-50/90 to-white/90 dark:from-red-900/20 dark:to-zinc-900/90",
        border: "group-hover:border-red-200 dark:group-hover:border-red-800",
        shadow: "group-hover:shadow-red-500/20"
    },
    {
        title: "Laboratorio Clínico",
        description: "Análisis clínicos completos con tecnología de última generación y resultados rápidos y precisos.",
        icon: TestTube,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        gradient: "from-blue-50/90 to-white/90 dark:from-blue-900/20 dark:to-zinc-900/90",
        border: "group-hover:border-blue-200 dark:group-hover:border-blue-800",
        shadow: "group-hover:shadow-blue-500/20"
    },
    {
        title: "Emergencias 24/7",
        description: "Servicio de emergencias disponible las 24 horas del día, los 7 días de la semana con personal especializado.",
        icon: Ambulance,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        gradient: "from-orange-50/90 to-white/90 dark:from-orange-900/20 dark:to-zinc-900/90",
        border: "group-hover:border-orange-200 dark:group-hover:border-orange-800",
        shadow: "group-hover:shadow-orange-500/20"
    },
    {
        title: "Hospitalización",
        description: "Áreas de hospitalización equipadas con tecnología moderna para el cuidado y recuperación de pacientes.",
        icon: BedDouble,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-100 dark:bg-purple-900/30",
        gradient: "from-purple-50/90 to-white/90 dark:from-purple-900/20 dark:to-zinc-900/90",
        border: "group-hover:border-purple-200 dark:group-hover:border-purple-800",
        shadow: "group-hover:shadow-purple-500/20"
    },
    {
        title: "Cirugía",
        description: "Quirófanos completamente equipados para procedimientos quirúrgicos de todas las especialidades.",
        icon: Scissors,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        gradient: "from-green-50/90 to-white/90 dark:from-green-900/20 dark:to-zinc-900/90",
        border: "group-hover:border-green-200 dark:group-hover:border-green-800",
        shadow: "group-hover:shadow-green-500/20"
    },
];

export default function Services() {
    return (
        <section id="services" className="py-24 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Nuestros Servicios
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                        Servicios médicos integrales con atención 100% presencial y tecnología de vanguardia.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service, index) => (
                        <Link href="/servicios" key={service.title}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative h-full overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br ${service.gradient} p-8 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${service.border} ${service.shadow} dark:border-white/5`}
                            >
                                {/* Hover Glow */}
                                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 ${service.bg.replace('bg-', 'bg-')}`} />

                                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${service.bg} ${service.color}`}>
                                    <service.icon className="h-7 w-7" />
                                </div>

                                <h3 className="mb-3 text-xl font-bold text-gray-900 transition-colors dark:text-white">
                                    {service.title}
                                </h3>

                                <p className="text-gray-600 dark:text-gray-300">
                                    {service.description}
                                </p>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
