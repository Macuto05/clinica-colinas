"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/domain/entities/User";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: Partial<User> | null;
    loading: boolean;
    login: (userData: Partial<User>, redirectPath?: string) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Partial<User> | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch("/api/auth/me", {
                cache: "no-store",
                headers: {
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = (userData: Partial<User>, redirectPath?: string) => {
        setUser(userData);

        // Smart Redirect Logic
        // If user is ADMIN and attempts to go to the default patient dashboard, force them to Admin Panel
        if (userData.role === "ADMIN") {
            if (!redirectPath || redirectPath.startsWith("/dashboard") || redirectPath === "/") {
                router.push("/admin");
                return;
            }
        }

        // If user is DOCTOR and attempts to go to default dashboard
        if (userData.role === "DOCTOR") {
            if (!redirectPath || redirectPath === "/dashboard" || redirectPath === "/") {
                router.push("/dashboard/doctor");
                return;
            }
        }

        if (redirectPath) {
            router.push(redirectPath);
            return;
        }

        // Default redirects if no specific path was requested
        if (userData.role === "ADMIN") {
            router.push("/admin");
        } else if (userData.role === "DOCTOR" || userData.role === "MEDICO") { // Added MEDICO role
            router.push("/medico");
        } else if (userData.role === "ALMACEN") {
            router.push("/almacen");
        } else if (["CAJA", "CAJA Y FACTURACION", "CAJA Y FACTURACIÓN", "CAJA/FACTURACION", "CAJA/FACTURACIÓN"].includes(userData.role?.toUpperCase() || "")) {
            router.push("/caja");
        } else if (userData.role === "RECEPCION") {
            router.push("/recepcion");
        } else {
            router.push("/dashboard");
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
