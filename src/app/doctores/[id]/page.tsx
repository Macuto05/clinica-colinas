
import { notFound, redirect } from "next/navigation";
import { getDoctorById } from "@/app/actions/doctors";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Mail, Phone, Award, ShieldCheck } from "lucide-react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import DoctorSchedule from "./DoctorSchedule";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function DoctorPage({ params }: PageProps) {
    const { id } = await params;
    const doctorId = parseInt(id);

    if (isNaN(doctorId)) {
        notFound();
    }

    const doctor = await getDoctorById(doctorId);

    if (!doctor) {
        notFound();
    }

    // Check if user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let isLoggedIn = false;

    if (token) {
        try {
            // Basic verify
            jwt.decode(token);
            isLoggedIn = true;
        } catch (e) {
            isLoggedIn = false;
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            <Navbar />

            {/* Header / Hero */}
            <div className="relative bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-gray-700 pt-32 pb-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Link
                        href={`/especialidades`} // We could try to go back to the specific specialty if we passed it in search params
                        className="mb-8 inline-flex items-center gap-2 text-gray-500 hover:text-lime-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a especialidades
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                            {doctor.imageUrl ? (
                                <img
                                    src={doctor.imageUrl}
                                    alt={doctor.name}
                                    className="h-40 w-40 rounded-full object-cover shadow-xl border-4 border-white dark:border-zinc-800"
                                />
                            ) : (
                                <div className="h-40 w-40 rounded-full bg-gradient-to-br from-lime-100 to-green-100 flex items-center justify-center text-6xl shadow-xl dark:from-lime-900/50 dark:to-green-900/50">
                                    👨‍⚕️
                                </div>
                            )}
                        </div>

                        {/* Header Info */}
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                                        {doctor.name}
                                    </h1>
                                    <p className="mt-2 text-xl font-medium text-lime-600 dark:text-lime-400">
                                        {doctor.specialty}
                                    </p>
                                </div>


                            </div>

                            <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-lime-600" />
                                    <span>{doctor.license}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Biography */}
                        <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Award className="h-5 w-5 text-lime-600" />
                                Sobre el Especialista
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {doctor.biography || "El doctor no ha proporcionado una descripción detallada aún."}
                            </p>
                        </div>


                        {/* Schedule Calendar */}
                        <DoctorSchedule schedule={doctor.schedule} />
                    </div>

                    {/* Contact Info Sidebar - Reduced to only essential buttons since private info is hidden */}
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800 border border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                ¿Desea agendar una cita?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Reserve su espacio de manera rápida y segura a través de nuestra plataforma.
                            </p>

                            {isLoggedIn ? (
                                <Link
                                    href={`/citas/nueva?doctorId=${doctor.id}`}
                                    className="flex w-full items-center justify-center rounded-lg bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-lime-700"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Agendar Ahora
                                </Link>
                            ) : (
                                <Link
                                    href={`/auth/login?redirect=/doctores/${doctor.id}`}
                                    className="flex w-full items-center justify-center rounded-lg bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-lime-700"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Iniciar Sesión
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <Footer />
        </div>
    );
}
