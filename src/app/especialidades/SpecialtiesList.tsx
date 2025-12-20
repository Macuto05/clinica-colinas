"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { Specialty } from "@/data/specialties-data";

interface SpecialtiesListProps {
    specialties: Specialty[]; // Curated list of active specialties
    allLetters: string[];
}

export default function SpecialtiesList({ specialties, allLetters }: SpecialtiesListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());

    // Normalize text: remove accents and convert to lowercase
    const normalize = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    // Filter specialties based on search term with accent-insensitive search
    const filteredSpecialties = useMemo(() => {
        if (!searchTerm) return specialties;

        const normalizedSearch = normalize(searchTerm);

        const filtered = specialties.filter(specialty =>
            normalize(specialty.name).includes(normalizedSearch)
        );

        // Sort by relevance
        return filtered.sort((a, b) => {
            const aNorm = normalize(a.name);
            const bNorm = normalize(b.name);

            if (aNorm === normalizedSearch) return -1;
            if (bNorm === normalizedSearch) return 1;

            const aStarts = aNorm.startsWith(normalizedSearch);
            const bStarts = bNorm.startsWith(normalizedSearch);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            return a.name.localeCompare(b.name);
        });
    }, [searchTerm, specialties]);

    // Get letters that have filtered specialties, ordered by relevance
    const filteredLetters = useMemo(() => {
        if (!searchTerm) {
            // Only show letters that actually have specialties in our filtered list
            const letters = new Set(specialties.map(s => s.letter));
            return Array.from(letters).sort();
        }

        const seenLetters = new Set<string>();
        const lettersInOrder: string[] = [];

        filteredSpecialties.forEach(specialty => {
            if (!seenLetters.has(specialty.letter)) {
                seenLetters.add(specialty.letter);
                lettersInOrder.push(specialty.letter);
            }
        });

        return lettersInOrder;
    }, [filteredSpecialties, searchTerm, specialties]);

    // Toggle letter expansion
    const toggleLetter = (letter: string) => {
        const newExpanded = new Set(expandedLetters);
        if (newExpanded.has(letter)) {
            newExpanded.delete(letter);
        } else {
            newExpanded.add(letter);
        }
        setExpandedLetters(newExpanded);
    };

    // Expand all letters when searching
    useEffect(() => {
        if (searchTerm) {
            setExpandedLetters(new Set(filteredLetters));
        }
    }, [searchTerm, filteredLetters]);

    return (
        <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mx-auto mb-16 max-w-2xl"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar especialidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-full border-2 border-gray-200 bg-white py-4 pl-12 pr-6 text-gray-900 placeholder-gray-400 shadow-lg transition-all focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20 dark:border-gray-700 dark:bg-zinc-800 dark:text-white dark:placeholder-gray-500"
                        />
                    </div>
                </motion.div>

                <div className="space-y-4">
                    {filteredLetters.map((letter, index) => {
                        const letterSpecialties = filteredSpecialties.filter(s => s.letter === letter);
                        const isExpanded = expandedLetters.has(letter);
                        const count = letterSpecialties.length;

                        return (
                            <motion.div
                                key={letter}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-zinc-800"
                            >
                                {/* Letter Header */}
                                <button
                                    onClick={() => toggleLetter(letter)}
                                    className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-lime-500 to-green-600 text-2xl font-bold text-white shadow-lg">
                                            {letter}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                Letra {letter}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {count} {count === 1 ? 'especialidad disponible' : 'especialidades disponibles'}
                                            </p>
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChevronDown className="h-6 w-6 text-gray-400" />
                                    </motion.div>
                                </button>

                                {/* Specialties Grid */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="border-t border-gray-100 dark:border-gray-700"
                                        >
                                            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                                                {letterSpecialties.map((specialty) => (
                                                    <Link
                                                        key={specialty.id}
                                                        href={`/especialidades/${specialty.slug}`}
                                                        className="group"
                                                    >
                                                        <motion.div
                                                            whileHover={{ scale: 1.02 }}
                                                            className="h-full rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm transition-all hover:border-lime-300 hover:shadow-md dark:border-gray-700 dark:from-zinc-900 dark:to-zinc-800 dark:hover:border-lime-600"
                                                        >
                                                            <div className="mb-3 text-3xl">{specialty.icon}</div>
                                                            <h4 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-lime-600 dark:text-white dark:group-hover:text-lime-400">
                                                                {specialty.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {specialty.description}
                                                            </p>
                                                            <div className="mt-4 flex items-center text-sm font-medium text-lime-600 dark:text-lime-400">
                                                                Ver más
                                                                <motion.span
                                                                    className="ml-1"
                                                                    initial={{ x: 0 }}
                                                                    whileHover={{ x: 4 }}
                                                                >
                                                                    →
                                                                </motion.span>
                                                            </div>
                                                        </motion.div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* No Results */}
                {filteredSpecialties.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-16 text-center"
                    >
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            No se encontraron especialidades
                        </h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Intenta con otro término de búsqueda
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
