
"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export function AdminRedirect() {
    const { user } = useAuth();

    if (!user || user.role !== "ADMIN") return null;

    return (
        <div className="fixed top-0 left-0 w-full z-[100] bg-red-600 text-white p-4 text-center shadow-xl">
            <h2 className="text-xl font-bold mb-2">⚠️ ERES ADMINISTRADOR PERO ESTÁS EN LA VISTA DE PACIENTE ⚠️</h2>
            <Link
                href="/admin"
                className="inline-block bg-white text-red-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition"
            >
                IR AL PANEL DE ADMIN AHORA
            </Link>
        </div>
    );
}
