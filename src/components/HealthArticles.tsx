"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categories, getFeaturedArticles } from "@/data/articles-data";

export default function HealthArticles() {
    const [activeCategory, setActiveCategory] = useState("Últimas agregadas");
    const featuredArticles = getFeaturedArticles(3);

    return (
        <section className="relative py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                        Todo sobre salud
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
                        Información confiable para el cuidado de tu familia
                    </p>
                </div>

                {/* Category Pills */}
                <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`rounded-full border px-6 py-2.5 text-sm font-semibold transition-all ${activeCategory === category
                                    ? "border-[#a1db4b] bg-[#a1db4b] text-white shadow-lg shadow-[#a1db4b]/20"
                                    : "border-gray-200 bg-white/50 text-gray-600 hover:border-[#a1db4b] hover:text-[#a1db4b] dark:border-gray-700 dark:bg-zinc-800/50 dark:text-gray-300"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Featured Articles Grid */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {featuredArticles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/articulos/${article.slug}`}
                            className="group relative overflow-hidden rounded-2xl bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900/80"
                        >
                            {/* Image */}
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                {/* Category Badge */}
                                <div className="absolute left-4 top-4">
                                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-900 backdrop-blur-md">
                                        {article.category}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="mb-3 text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-[#a1db4b] dark:text-white">
                                    {article.title}
                                </h3>
                                <p className="mb-4 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
                                    {article.excerpt}
                                </p>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                                        {article.readTime} min lectura
                                    </span>
                                    <span className="flex items-center gap-1 text-sm font-bold text-[#a1db4b]">
                                        Leer artículo
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Button */}
                <div className="mt-16 text-center">
                    <Link
                        href="/articulos"
                        className="inline-flex items-center gap-2 rounded-full border-2 border-gray-900 px-8 py-3 text-lg font-bold text-gray-900 transition-all hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                        Explorar todos los artículos
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
