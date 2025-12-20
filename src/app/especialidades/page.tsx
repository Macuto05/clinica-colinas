
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { specialties, getAllLetters } from "@/data/specialties-data";
import { getActiveSpecialties } from "@/app/actions/specialties";
import SpecialtiesList from "./SpecialtiesList";

// Server Component
export default async function EspecialidadesPage() {
    // 1. Get active specialty names from DB
    const activeNames = await getActiveSpecialties();

    // 2. Filter our rich static data to only include active ones
    const activeSpecialties = specialties.filter(s => activeNames.includes(s.name));

    // 3. Get relevant letters
    const allLetters = getAllLetters().filter(letter =>
        activeSpecialties.some(s => s.letter === letter)
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-lime-50 to-green-50 dark:from-zinc-900 dark:to-black pt-32 pb-6">
                <div className="absolute top-0 left-0 -z-10 h-full w-full">
                    <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-lime-200 opacity-20 blur-3xl" />
                    <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-green-200 opacity-20 blur-3xl" />
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Use a simple div for initial render to avoid client hydration mismatch with framer-motion in server component if strictly needed, 
                        or use a Client Wrapper for the Hero. For simplicity, we'll keep the text static or use a clear client wrapper if we want animation.
                        Since we are converting page to Server Component, we lose direct framer-motion on top level elements unless wrapped.
                        Let's just render static HTML for the Hero title to be effective and safe.
                     */}
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                            Nuestras <span className="text-lime-600">Especialidades</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                            Contamos con un equipo multidisciplinario de especialistas altamente calificados para brindarte la mejor atención médica.
                        </p>
                    </div>
                </div>
            </section>

            {/* List Section (Client Component) */}
            <SpecialtiesList specialties={activeSpecialties} allLetters={allLetters} />

            <Footer />
        </div>
    );
}
