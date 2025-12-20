"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { categories, getArticlesByCategory, articles } from "@/data/articles-data";

export default function ArticulosPage() {
    const [activeCategory, setActiveCategory] = useState("Últimas agregadas");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredArticles = searchTerm
        ? articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : getArticlesByCategory(activeCategory);

    return (
        <main className="min-h-screen bg-gray-50 pt-32 dark:bg-zinc-900">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-slate-700 to-slate-800 py-16 dark:from-slate-900 dark:to-zinc-900">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                            Todo sobre salud
                        </h1>
                        <p className="mt-4 text-lg text-gray-300">
                            Encuentra artículos sobre temas de salud que te interesan
                        </p>

                        {/* Search Bar */}
                        <div className="mx-auto mt-8 max-w-2xl">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar artículos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 placeholder-gray-500 focus:border-[#a1db4b] focus:outline-none focus:ring-2 focus:ring-[#a1db4b]/20"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Pills */}
            <section className="border-b border-gray-200 bg-white py-6 dark:border-gray-800 dark:bg-zinc-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    setActiveCategory(category);
                                    setSearchTerm("");
                                }}
                                className={`rounded-full border-2 px-5 py-2 text-sm font-medium transition-all ${activeCategory === category && !searchTerm
                                        ? "border-[#a1db4b] bg-[#a1db4b] text-white"
                                        : "border-gray-300 text-gray-700 hover:border-[#a1db4b] hover:bg-[#a1db4b]/10 dark:border-gray-600 dark:text-gray-300"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {searchTerm && (
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            {filteredArticles.length} resultados para "{searchTerm}"
                        </p>
                    )}

                    {filteredArticles.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                No se encontraron artículos
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredArticles.map((article) => (
                                <Link
                                    key={article.id}
                                    href={`/articulos/${article.slug}`}
                                    className="group overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-xl dark:bg-zinc-800"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <div className="absolute left-3 top-3">
                                            <span className="rounded-full bg-[#a1db4b] px-3 py-1 text-xs font-semibold text-white">
                                                {article.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="mb-2 text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-[#a1db4b] dark:text-white">
                                            {article.title}
                                        </h3>
                                        <p className="mb-4 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
                                            {article.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                                            <span>{article.readTime} min</span>
                                            <span className="flex items-center gap-1 text-[#a1db4b] font-medium">
                                                Leer más
                                                <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
