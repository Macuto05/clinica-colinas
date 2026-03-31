import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { LayoutDashboard, Package, ArrowLeftRight, LogOut, Settings, Factory, ClipboardList } from "lucide-react";
import AdminProfile from "@/app/admin/components/AdminProfile"; // Reusing profile component
import ExchangeRateWidget from "@/components/admin/ExchangeRateWidget";
import { cn } from "@/lib/utils";

export default async function AlmacenLayout({
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
    if (!payload || ((payload as any).role !== "ALMACEN" && (payload as any).role !== "ADMIN")) {
        redirect("/login");
    }

    const userRepository = new PrismaUserRepository();
    const user = await userRepository.findByEmail(payload.email);

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-green-50/30 to-lime-50/30 flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] transform transition-transform duration-300 lg:translate-x-0 -translate-x-full">
                <div className="flex h-20 items-center px-6 border-b border-white/40">
                    <img
                        src="/logo-clinicas-colina.jpg"
                        alt="Clinica Colinas Logo"
                        className="h-12 w-auto object-contain"
                    />
                </div>

                <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)] custom-scrollbar">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">
                        Almacén
                    </p>
                    <NavItem href="/almacen" icon={<LayoutDashboard size={20} />} label="Resumen" />

                    <div className="my-4 border-t border-white/40" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Gestión
                    </p>
                    <NavItem href="/almacen/insumos" icon={<Package size={20} />} label="Insumos / Catálogo" />
                    <NavItem href="/almacen/almacenes" icon={<Factory size={20} />} label="Almacenes" />
                    <NavItem href="/almacen/traslados" icon={<ArrowLeftRight size={20} />} label="Traslados" />
                    <NavItem href="/almacen/movimientos" icon={<ClipboardList size={20} />} label="Historial Movimientos" />
                    <NavItem href="/almacen/pedidos" icon={<Package size={20} />} label="Pedidos de Compra" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <div className="flex-1" /> {/* Spacer */}

                </div>

                <AdminProfile user={{ name: user.name }} role="Almacenista" />
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
                <header className="flex lg:hidden items-center justify-between sticky top-0 z-40 bg-white/30 backdrop-blur-md border-b border-white/40 p-4">
                    <span className="text-lg font-bold text-gray-900">Panel Almacén</span>
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
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 hover:bg-white/60 hover:text-[#a1db4b] hover:shadow-sm transition-all duration-300 group"
        >
            <div className="transition-transform group-hover:scale-110 group-hover:rotate-3">
                {icon}
            </div>
            <span className="font-bold text-sm tracking-tight">{label}</span>
        </Link>
    );
}
