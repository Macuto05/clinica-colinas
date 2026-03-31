
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
        <div className="space-y-8">
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] relative overflow-hidden group transition-all duration-500 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.12)]">
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl transition-all duration-700 group-hover:bg-lime-500/20" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transition-all duration-700 group-hover:bg-blue-500/20" />
                
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">{displayName}</span>
                    </h1>
                    <p className="text-gray-500 font-medium mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                        Panel de administración general del sistema.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Doctores Registrados"
                    value={doctorCount}
                    icon={<Award className="h-6 w-6 text-lime-600" />}
                    href="/admin/doctores"
                    color="lime"
                />
                <StatCard
                    label="Pacientes Registrados"
                    value={patientCount}
                    icon={<Users className="h-6 w-6 text-blue-600" />}
                    href="/admin/pacientes"
                    color="blue"
                />
                <StatCard
                    label="Personal / Staff"
                    value={staffCount}
                    icon={<Briefcase className="h-6 w-6 text-orange-600" />}
                    href="/admin/personal"
                    color="orange"
                />
                <StatCard
                    label="Citas Totales"
                    value={appointmentCount}
                    icon={<Calendar className="h-6 w-6 text-purple-600" />}
                    href="/admin/citas"
                    color="purple"
                />
                <StatCard
                    label="Especialidades Activas"
                    value={specialtyCount}
                    icon={<Activity className="h-6 w-6 text-pink-600" />}
                    href="/admin/especialidades"
                    color="pink"
                />
                <StatCard
                    label="Roles de Usuario"
                    value={roleCount}
                    icon={<Shield className="h-6 w-6 text-emerald-600" />}
                    href="/admin/roles"
                    color="emerald"
                />
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, href, color }: { label: string; value: number; icon: React.ReactNode; href: string; color: string }) {
    const colorMap: Record<string, string> = {
        lime: "shadow-lime-500/10 group-hover:shadow-lime-500/20",
        blue: "shadow-blue-500/10 group-hover:shadow-blue-500/20",
        orange: "shadow-orange-500/10 group-hover:shadow-orange-500/20",
        purple: "shadow-purple-500/10 group-hover:shadow-purple-500/20",
        pink: "shadow-pink-500/10 group-hover:shadow-pink-500/20",
        emerald: "shadow-emerald-500/10 group-hover:shadow-emerald-500/20",
    };

    return (
        <Link
            href={href}
            className={`group block p-8 rounded-[2rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] hover:bg-white/60 hover:scale-[1.02] hover:border-white transition-all duration-300 ${colorMap[color] || ""}`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-white/60 border border-white/80 shadow-sm shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    {icon}
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-50/50 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white translate-x-4 group-hover:translate-x-0">
                   <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                </div>
            </div>
            
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                {label}
            </p>
            <p className="text-4xl font-black text-gray-900 tracking-tight">
                {value}
            </p>
        </Link>
    );
}
