
"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function RoleRedirect() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [shouldShowWarning, setShouldShowWarning] = useState(false);

    const STAFF_ROLES = ['ADMIN', 'DOCTOR', 'MEDICO', 'RECEPCION', 'ALMACEN', 'CAJA', 'CAJA Y FACTURACION', 'CAJA Y FACTURACIÓN', 'CAJA/FACTURACION', 'CAJA/FACTURACIÓN'];

    useEffect(() => {
        if (loading || !user) return;

        const role = (user.role || "").toUpperCase();
        
        // If user is Staff but in Patient Dashboard, show warning and prepare for redirect
        if (STAFF_ROLES.includes(role) && pathname.startsWith("/dashboard")) {
            setShouldShowWarning(true);
            
            // Auto-redirect after 3 seconds if they are just at the dashboard root
            if (pathname === "/dashboard") {
                const timer = setTimeout(() => {
                    redirectToCorrectPanel(role);
                }, 3000);
                return () => clearTimeout(timer);
            }
        } else {
            setShouldShowWarning(false);
        }
    }, [user, loading, pathname]);

    const redirectToCorrectPanel = (role: string) => {
        if (role === "ADMIN") router.push("/admin");
        else if (role === "DOCTOR" || role === "MEDICO") router.push("/medico");
        else if (role === "ALMACEN") router.push("/almacen");
        else if (['CAJA', 'CAJA Y FACTURACION', 'CAJA Y FACTURACIÓN', 'CAJA/FACTURACION', 'CAJA/FACTURACIÓN'].includes(role)) router.push("/caja");
        else if (role === "RECEPCION") router.push("/recepcion");
    };

    if (!shouldShowWarning || !user) return null;

    const roleLabel = ['DOCTOR', 'MEDICO'].includes(user.role?.toUpperCase() || "") ? 'MÉDICO' : 
                     user.role === 'ADMIN' ? 'ADMINISTRADOR' : 
                     'PERSONAL AUTORIZADO';

    return (
        <div className="fixed top-0 left-0 w-full z-[100] bg-amber-600 text-white shadow-2xl animate-in slide-in-from-top duration-500">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-black text-sm uppercase tracking-wider">
                            VISTA DE PACIENTE ACTIVA
                        </p>
                        <p className="text-xs opacity-90 font-medium">
                            Has iniciado sesión como <span className="font-bold underline">{roleLabel}</span>. Esta vista no es para ti.
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={() => redirectToCorrectPanel((user.role || "").toUpperCase())}
                    className="flex items-center gap-2 bg-white text-amber-700 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                    Ir a mi Panel <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}
