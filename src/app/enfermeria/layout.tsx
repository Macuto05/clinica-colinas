import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { Heart, Package, FlaskConical, LogOut, LayoutDashboard } from "lucide-react";
import AdminProfile from "@/app/admin/components/AdminProfile";
import ExchangeRateWidget from "@/components/admin/ExchangeRateWidget";

export default async function EnfermeriaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) redirect("/login");

    const payload = await JWTService.verifyToken(token);
    // Allow ENFERMERIA role — also allow RECEPCION and ADMIN for now so it's accessible
    const allowedRoles = ["ENFERMERIA", "RECEPCION", "ADMIN"];
    if (!payload || !allowedRoles.includes((payload as any).role)) {
        redirect("/login");
    }

    const userRepository = new PrismaUserRepository();
    const user = await userRepository.findByEmail(payload.email);
    if (!user) redirect("/login");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50/20 to-cyan-50/10 flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
                <div className="flex h-16 items-center px-6 border-b border-white/40 shrink-0 bg-white/30">
                    <img
                        src="/logo-clinicas-colina.jpg"
                        alt="Clinica Colinas Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                <div className="flex-1 p-3 space-y-0 overflow-y-auto">
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 mt-3">
                        Enfermería
                    </p>
                    <NavItem href="/enfermeria" icon={<LayoutDashboard size={16} />} label="Centro de Pacientes" />

                    <div className="my-3 border-t border-white/40 mx-2" />

                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">
                        Acciones Rápidas
                    </p>
                    <NavItem href="/enfermeria" icon={<Package size={16} />} label="Carga de Insumos" />
                    <NavItem href="/enfermeria" icon={<FlaskConical size={16} />} label="Solicitar Laboratorio" />
                </div>

                <div className="shrink-0 p-4 border-t border-white/40">
                    <AdminProfile user={{ name: user.name }} role="Enfermería" />
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                <header className="hidden lg:flex items-center justify-end sticky top-0 z-40 px-8 py-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <ExchangeRateWidget />
                    </div>
                </header>

                <header className="flex lg:hidden items-center justify-between sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/50 p-4">
                    <span className="text-lg font-bold text-gray-900">Enfermería</span>
                    <ExchangeRateWidget />
                </header>

                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-white/60 hover:text-teal-700 hover:shadow-sm transition-all duration-300 group"
        >
            <div className="transition-transform group-hover:scale-110 shrink-0">{icon}</div>
            <span className="font-bold text-sm tracking-tight truncate">{label}</span>
        </Link>
    );
}
