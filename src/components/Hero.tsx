"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const slides = [
    {
        title: "Excelencia Médica a tu Alcance",
        subtitle: "Compromiso y Calidad",
        description: "Brindamos atención integral con tecnología de punta y un equipo humano dedicado a tu bienestar.",
        cta: "Reserva tu hora",
        ctaLink: "/dashboard/citas",
        image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1600&h=900&fit=crop",
    },
    {
        title: "Especialistas en Cuidar de Ti",
        subtitle: "Experiencia y Confianza",
        description: "Más de 15 especialidades médicas para acompañarte en cada etapa de tu vida y la de tu familia.",
        cta: "Nuestras Especialidades",
        ctaLink: "/especialidades",
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&h=900&fit=crop",
    },
    {
        title: "Tecnología al Servicio de tu Salud",
        subtitle: "Innovación Constante",
        description: "Diagnósticos precisos y tratamientos avanzados gracias a nuestra infraestructura moderna.",
        cta: "Conoce la Clínica",
        ctaLink: "/nosotros",
        image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&h=900&fit=crop",
    },
];

export default function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance slides
    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 6000);
        return () => clearInterval(timer);
    }, [currentSlide]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <section className="relative w-full pt-32 pb-12 md:pt-36 md:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative h-[500px] overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10 md:h-[600px]">
                    {/* Vibrant Glow Effect */}
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#a1db4b]/20 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />

                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.7, ease: "easeInOut" }}
                            className="absolute inset-0 h-full w-full"
                        >
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: `url(${slides[currentSlide].image})`,
                                }}
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
                        </motion.div>
                    </AnimatePresence>

                    {/* Content Container */}
                    <div className="relative flex h-full items-center px-8 md:px-16">
                        <div className="max-w-2xl">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#a1db4b]/30 bg-[#a1db4b]/10 px-4 py-1.5 backdrop-blur-sm">
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-[#a1db4b]" />
                                        <span className="text-sm font-bold uppercase tracking-wider text-[#a1db4b]">
                                            {slides[currentSlide].subtitle}
                                        </span>
                                    </div>

                                    <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                                        {slides[currentSlide].title}
                                    </h1>

                                    <p className="mb-8 text-lg leading-relaxed text-gray-200 md:text-xl">
                                        {slides[currentSlide].description}
                                    </p>

                                    <Link
                                        href={slides[currentSlide].ctaLink}
                                        className="group inline-flex items-center gap-2 rounded-full bg-[#a1db4b] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#a1db4b]/30 transition-all hover:bg-[#8bc34a] hover:shadow-xl hover:shadow-[#a1db4b]/40 hover:scale-105"
                                    >
                                        {slides[currentSlide].cta}
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="absolute bottom-6 right-6 flex gap-2">
                        <button
                            onClick={prevSlide}
                            className="group rounded-full border border-white/10 bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white hover:scale-110"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="h-5 w-5 text-white transition-colors group-hover:text-black" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="group rounded-full border border-white/10 bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white hover:scale-110"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="h-5 w-5 text-white transition-colors group-hover:text-black" />
                        </button>
                    </div>

                    {/* Progress Indicators */}
                    <div className="absolute bottom-6 left-8 flex gap-2 md:left-16">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className="group relative"
                                aria-label={`Go to slide ${index + 1}`}
                            >
                                <div
                                    className={`h-1 rounded-full transition-all duration-300 ${index === currentSlide
                                        ? "w-12 bg-[#a1db4b]"
                                        : "w-8 bg-white/30 group-hover:bg-white/50"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
