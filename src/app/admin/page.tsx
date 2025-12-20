
import { Users, Calendar, Award } from "lucide-react";
import Link from "next/link";
import prisma from "@/infrastructure/database/prisma/client";

export default async function AdminDashboardPage() {
    // 4. Counts
    const patientCount = await prisma.paciente.count();
    const doctorCount = await prisma.medico.count();
    const appointmentCount = await prisma.citaMedica.count();
    const revenueSum = await prisma.factura.aggregate({
        _sum: {
            total: true
        },
        where: {
            estadoFactura: 'PAGADA'
        }
    });

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Bienvenido, Administrador
            </h1>

            <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                    label="Doctores Registrados"
                    value={doctorCount}
                    icon={<Award className="h-6 w-6 text-lime-600" />}
                    href="/admin/doctores"
                />
                <StatCard
                    label="Pacientes Registrados"
                    value={patientCount}
                    icon={<Users className="h-6 w-6 text-blue-600" />}
                    href="/admin/users"
                />
                <StatCard
                    label="Citas Totales"
                    value={appointmentCount}
                    icon={<Calendar className="h-6 w-6 text-purple-600" />}
                    href="/admin/citas"
                />
            </div>

            <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Acciones Rápidas</h2>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/admin/doctores"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
                    >
                        Gestionar Doctores
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, href }: { label: string; value: number; icon: React.ReactNode; href: string }) {
    return (
        <Link
            href={href}
            className="block p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-lime-500 transition-all dark:bg-zinc-900 dark:border-zinc-800"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800">
                    {icon}
                </div>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {label}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {value}
            </p>
        </Link>
    );
}
