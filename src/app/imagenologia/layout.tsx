import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { Activity } from "lucide-react";
import AdminProfile from "../admin/components/AdminProfile";
import ExchangeRateWidget from "@/components/admin/ExchangeRateWidget";

export default async function ImagenologiaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Auth & Role Guard
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
        redirect("/login");
    }

    const payload = await JWTService.verifyToken(token);
    if (!payload) {
        redirect("/login");
    }

    const userRepository = new PrismaUserRepository();
    const user = await userRepository.findById(payload.userId);

    const roleName = user?.role?.toString().toUpperCase() || "";
    if (!user || (roleName !== "ADMIN" && roleName !== "IMAGENOLOGIA")) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/20 to-sky-50/20 flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] hidden lg:flex overflow-hidden flex flex-col">
                <div className="flex h-16 items-center px-6 border-b border-white/40 shrink-0 bg-white/30 backdrop-blur-sm">
                    <img
                        src="/logo-clinicas-colina.jpg"
                        alt="Clinica Colinas Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                <div className="flex-1 p-3 space-y-0 overflow-y-auto custom-scrollbar scroll-smooth">
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 mt-2">
                        Operaciones
                    </p>
                    <NavItem href="/imagenologia" icon={<Activity size={16} />} label="Bandeja de Imágenes" />
                </div>

                <div className="shrink-0 p-4 border-t border-white/40">
                    <AdminProfile 
                        user={{ name: user.name }} 
                        role={roleName === 'ADMIN' ? 'Administrador' : 'Técnico Imagenólogo'} 
                    />
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-end sticky top-0 z-40 px-8 py-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <ExchangeRateWidget />
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="flex lg:hidden items-center justify-between sticky top-0 z-40 bg-white/30 backdrop-blur-md border-b border-white/40 p-4">
                    <span className="text-lg font-black text-gray-900 tracking-tight underline decoration-[#3b82f6] decoration-4 underline-offset-4">Panel Imagenología</span>
                    <ExchangeRateWidget />
                </header>

                <main className="flex-1 p-8">
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
            className="flex items-center gap-3 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-white/60 hover:text-[#3b82f6] hover:shadow-sm transition-all duration-300 group"
        >
            <div className="transition-transform group-hover:scale-110 group-hover:rotate-3 shrink-0">
                {icon}
            </div>
            <span className="font-bold text-sm tracking-tight truncate">{label}</span>
        </Link>
    );
}
