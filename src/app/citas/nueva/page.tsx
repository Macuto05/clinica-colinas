
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDoctorById } from "@/app/actions/doctors";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppointmentForm from "./AppointmentForm";
import prisma from "@/infrastructure/database/prisma/client";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewAppointmentPage({ searchParams }: PageProps) {
    // 1. Check Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/auth/login?redirect=/citas/nueva");
    }

    let user;
    try {
        // Decode token to get user ID (assuming payload has id)
        const decoded: any = jwt.decode(token);
        if (!decoded || !decoded.id) {
            throw new Error("Invalid token");
        }

        // Fetch full user to be safe
        user = await prisma.usuario.findUnique({
            where: { usuarioId: parseInt(decoded.id) },
            include: { paciente: true, empleado: true }
        });
    } catch (e) {
        redirect("/auth/login?redirect=/citas/nueva");
    }

    if (!user) {
        redirect("/auth/login?redirect=/citas/nueva");
    }

    // 2. Get Doctor Info
    const { doctorId } = await searchParams;

    if (!doctorId) {
        redirect("/especialidades"); // Redirect if no doctor selected
    }

    const id = parseInt(Array.isArray(doctorId) ? doctorId[0] : doctorId);
    if (isNaN(id)) {
        notFound();
    }

    const doctor = await getDoctorById(id);

    if (!doctor) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            <Navbar />

            <div className="pt-32 pb-16">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-800">
                        <div className="mb-8 border-b border-gray-100 pb-6 dark:border-gray-700">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Agendar Nueva Cita
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Complete el formulario para reservar su consulta.
                            </p>
                        </div>

                        <AppointmentForm doctor={doctor} user={user} />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
