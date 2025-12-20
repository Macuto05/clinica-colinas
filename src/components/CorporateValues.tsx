"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Users, HeartHandshake, ArrowRight, Download, Check } from "lucide-react";

const tabs = [
    {
        id: "transparencia",
        label: "Transparencia",
        icon: ShieldCheck,
        title: "Transparencia Institucional",
        description: "Impulsamos prácticas que fortalezcan la credibilidad y confianza. Fomentamos el comportamiento organizacional ético, basado en principios de buen gobierno corporativo.",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
        action: { text: "Ver política de transparencia", link: "#" }
    },
    {
        id: "comunidad",
        label: "Comunidad",
        icon: Users,
        title: "Compromiso con la Comunidad",
        description: "Trabajamos activamente para mejorar la calidad de vida de nuestra comunidad a través de programas de salud preventiva, educación y operativos médicos en zonas vulnerables.",
        image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=600&fit=crop",
        action: { text: "Nuestros programas", link: "#" }
    },
    {
        id: "diversidad",
        label: "Diversidad e inclusión",
        icon: HeartHandshake,
        title: "Diversidad e Inclusión",
        description: "Promovemos un ambiente inclusivo donde cada persona es valorada. Creemos que la diversidad de nuestro equipo enriquece la atención que brindamos a nuestros pacientes.",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop",
        action: { text: "Conoce más", link: "#" }
    }
];

export default function CorporateValues() {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <section className="py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                        Nuestra Clínica
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
                        Conoce las iniciativas que nos definen como institución
                    </p>
                </div>

                <div className="grid gap-12 lg:grid-cols-12">
                    {/* Tabs Navigation (Left) */}
                    <div className="lg:col-span-4">
                        <div className="flex flex-col gap-4">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab.id === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab)}
                                        className={`group flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${isActive
                                                ? "border-[#a1db4b] bg-white shadow-lg dark:bg-zinc-800"
                                                : "border-transparent bg-white/50 hover:bg-white hover:shadow-md dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
                                            }`}
                                    >
                                        <div className={`rounded-full p-2 transition-colors ${isActive ? "bg-[#a1db4b] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-[#a1db4b]/10 group-hover:text-[#a1db4b] dark:bg-zinc-800 dark:text-gray-400"
                                            }`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className={`font-semibold ${isActive ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                                            }`}>
                                            {tab.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Area (Right) */}
                    <div className="lg:col-span-8">
                        <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl dark:bg-zinc-900 md:p-12">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid gap-8 md:grid-cols-2"
                                >
                                    {/* Text Content */}
                                    <div className="flex flex-col justify-center">
                                        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#a1db4b]/10 text-[#a1db4b]">
                                            <activeTab.icon className="h-8 w-8" />
                                        </div>
                                        <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                                            {activeTab.title}
                                        </h3>
                                        <p className="mb-8 text-gray-600 dark:text-gray-300">
                                            {activeTab.description}
                                        </p>

                                        {/* Action Card */}
                                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-[#a1db4b]/30 hover:bg-[#a1db4b]/5 dark:border-zinc-800 dark:bg-zinc-800/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a1db4b] text-white">
                                                        <Check className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {activeTab.action.text}
                                                    </span>
                                                </div>
                                                <button className="rounded-full bg-white p-2 text-gray-900 shadow-sm transition-transform hover:scale-110 dark:bg-zinc-700 dark:text-white">
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image */}
                                    <div className="relative h-64 overflow-hidden rounded-2xl md:h-full">
                                        <img
                                            src={activeTab.image}
                                            alt={activeTab.title}
                                            className="h-full w-full object-cover"
                                        />
                                        {/* Decorative Circle */}
                                        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full border-[20px] border-[#a1db4b]/20" />
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
