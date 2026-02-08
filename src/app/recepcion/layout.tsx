import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { LayoutDashboard, Users, CalendarPlus, LogOut, Settings } from "lucide-react";
import AdminProfile from "@/app/admin/components/AdminProfile"; // Reusing profile component
import ExchangeRateWidget from "@/components/admin/ExchangeRateWidget";

export default async function RecepcionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
        redirect("/login");
    }

    const payload = await JWTService.verifyToken(token);
    if (!payload || (payload as any).role !== "RECEPCION") {
        redirect("/login");
    }

    const userRepository = new PrismaUserRepository();
    const user = await userRepository.findByEmail(payload.email);

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-300 lg:translate-x-0 -translate-x-full">
                <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-zinc-800">
                    <img
                        src="/logo-clinicas-colina.jpg"
                        alt="Clinica Colinas Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">
                        Recepción
                    </p>
                    <NavItem href="/recepcion" icon={<LayoutDashboard size={20} />} label="Agenda del Día" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Gestión
                    </p>
                    <NavItem href="/recepcion/pacientes" icon={<Users size={20} />} label="Pacientes" />
                    <NavItem href="/recepcion/citas/nueva" icon={<CalendarPlus size={20} />} label="Nueva Cita" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <div className="flex-1" /> {/* Spacer */}

                </div>

                <AdminProfile user={{ name: user.name }} role="Recepcionista" />
            </aside>

            {/* Content Area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

                {/* Desktop Header - Floating Widget Style */}
                <header className="hidden lg:flex items-center justify-end sticky top-0 z-40 px-8 py-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <ExchangeRateWidget />
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="flex lg:hidden items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 dark:bg-zinc-900/80 p-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Recepción</span>
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
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-lime-50 hover:text-lime-700 dark:text-gray-300 dark:hover:bg-lime-900/20 dark:hover:text-lime-400 transition-colors"
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
}
