
import { Users, Calendar, Award, Briefcase, Shield, Activity } from "lucide-react";
import Link from "next/link";
import prisma from "@/infrastructure/database/prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";

export default async function AdminDashboardPage() {
    // 1. Auth & User Fetch
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) redirect("/login");

    const payload = await JWTService.verifyToken(token);
    if (!payload) redirect("/login");

    const userRepository = new PrismaUserRepository();
    const user = await userRepository.findById(payload.userId);

    if (!user) redirect("/login");

    // 4. Counts
    const patientCount = await prisma.paciente.count();
    const doctorCount = await prisma.medico.count();
    const appointmentCount = await prisma.citaMedica.count();

    // New counts
    const staffCount = await prisma.empleado.count({
        where: { medico: null } // Exclude doctors from staff count
    });
    const roleCount = await prisma.rol.count();
    const specialtyCount = await prisma.especialidad.count({
        where: { activa: true }
    });

    const revenueSum = await prisma.factura.aggregate({
        _sum: {
            total: true
        },
        where: {
            estadoFactura: 'PAGADA'
        }
    });

    const firstName = user.firstName?.split(" ")[0] || "";
    const lastName = user.lastName?.split(" ")[0] || "";
    const displayName = `${firstName} ${lastName}`.trim() || user.name;

    return (
        <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Bienvenido, {displayName}
                </h1>
                <p className="text-gray-500 mt-1">
                    Panel de administración general del sistema.
                </p>
            </div>

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
                    href="/admin/pacientes"
                />
                <StatCard
                    label="Personal / Staff"
                    value={staffCount}
                    icon={<Briefcase className="h-6 w-6 text-orange-600" />}
                    href="/admin/personal"
                />
                <StatCard
                    label="Citas Totales"
                    value={appointmentCount}
                    icon={<Calendar className="h-6 w-6 text-purple-600" />}
                    href="/admin/citas"
                />
                <StatCard
                    label="Especialidades Activas"
                    value={specialtyCount}
                    icon={<Activity className="h-6 w-6 text-pink-600" />}
                    href="/admin/especialidades"
                />
                <StatCard
                    label="Roles de Usuario"
                    value={roleCount}
                    icon={<Shield className="h-6 w-6 text-emerald-600" />}
                    href="/admin/roles"
                />
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
