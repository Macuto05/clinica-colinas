"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Share2 } from "lucide-react";
import { getArticleBySlug, getRelatedArticles } from "@/data/articles-data";
import { getDoctorsBySpecialtyId } from "@/data/doctors-data";

export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const article = getArticleBySlug(resolvedParams.slug);

    if (!article) {
        notFound();
    }

    const relatedArticles = getRelatedArticles(article.id);
    const doctors = getDoctorsBySpecialtyId(article.specialtyId);
    const doctor = doctors.find(d => d.id === article.doctorId) || doctors[0];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <main className="min-h-screen bg-gray-50 pt-24 dark:bg-zinc-900">
            <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-8 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Link href="/" className="hover:text-[#a1db4b]">Inicio</Link>
                    <span>/</span>
                    <Link href="/articulos" className="hover:text-[#a1db4b]">Artículos</Link>
                    <span>/</span>
                    <span className="text-gray-900 dark:text-white">{article.category}</span>
                </nav>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Header */}
                        <div className="mb-8">
                            <Link
                                href="/articulos"
                                className="mb-4 inline-flex items-center gap-2 text-sm text-[#a1db4b] hover:underline"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver a artículos
                            </Link>

                            <div className="mb-3">
                                <span className="rounded-full bg-[#a1db4b] px-4 py-1.5 text-sm font-semibold text-white">
                                    {article.category}
                                </span>
                            </div>

                            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                                {article.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(article.publishedAt)}
                                </span>
                                <span>•</span>
                                <span>{article.readTime} min de lectura</span>
                                <button className="ml-auto flex items-center gap-2 text-[#a1db4b] hover:underline">
                                    <Share2 className="h-4 w-4" />
                                    Compartir
                                </button>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="mb-8 overflow-hidden rounded-xl">
                            <img
                                src={article.image}
                                alt={article.title}
                                className="h-96 w-full object-cover"
                            />
                        </div>

                        {/* Article Content */}
                        <div
                            className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-a:text-[#a1db4b]"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-6">
                            {/* Doctor Card */}
                            {doctor && (
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-zinc-800">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                                        Artículo realizado en colaboración con:
                                    </h3>

                                    <div className="mb-4 flex items-center gap-4">
                                        <img
                                            src={doctor.photo}
                                            alt={doctor.name}
                                            className="h-16 w-16 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {doctor.name}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Especialidades
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="inline-block rounded-full border border-[#a1db4b] px-3 py-1 text-xs font-medium text-[#a1db4b]">
                                            {doctor.credentials}
                                        </span>
                                    </div>

                                    <Link
                                        href={`/registro?doctor=${doctor.id}`}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#a1db4b] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#8bc34a] hover:shadow-lg"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        Agendar cita presencial
                                    </Link>
                                </div>
                            )}

                            {/* Related Articles */}
                            {relatedArticles.length > 0 && (
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-zinc-800">
                                    <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                                        Te puede interesar
                                    </h3>
                                    <div className="space-y-4">
                                        {relatedArticles.map((related) => (
                                            <Link
                                                key={related.id}
                                                href={`/articulos/${related.slug}`}
                                                className="group flex gap-3"
                                            >
                                                <img
                                                    src={related.image}
                                                    alt={related.title}
                                                    className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                                                />
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#a1db4b] dark:text-white">
                                                        {related.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                                        {related.readTime} min
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </article>
        </main>
    );
}
