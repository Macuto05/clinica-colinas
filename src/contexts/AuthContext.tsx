"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/domain/entities/User";
import { useRouter } from "next/navigation";
import { CAJA_ROLES } from "@/lib/constants/roles";

interface AuthContextType {
    user: Partial<User> | null;
    loading: boolean;
    login: (userData: Partial<User>, redirectPath?: string) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
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
                    
                    // Automatic Role Redirection after session restore (only if at home or dashboard root)
                    const path = window.location.pathname;
                    if (path === "/" || path === "/dashboard" || path === "/login") {
                        handleRoleRedirect(data.user);
                    }
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

    const handleRoleRedirect = (userData: Partial<User>) => {
        const role = (userData.role || "").toUpperCase();
        
        let targetPath = "/dashboard";

        if (role === "ADMIN") {
            targetPath = "/admin";
        } else if (role === "DOCTOR" || role === "MEDICO") {
            targetPath = "/medico";
        } else if (role === "ALMACEN") {
            targetPath = "/almacen";
        } else if ((CAJA_ROLES as readonly string[]).includes(role)) {
            targetPath = "/caja";
        } else if (role === "RECEPCION") {
            targetPath = "/recepcion";
        } else if (role === "ENFERMERIA") {
            targetPath = "/enfermeria";
        } else if (role === "FARMACIA" || role === "INVENTORY") {
            targetPath = "/farmacia";
        } else if (role === "LABORATORIO") {
            targetPath = "/laboratorio";
        } else if (role === "IMAGENOLOGIA") {
            targetPath = "/imagenologia";
        }

        if (window.location.pathname !== targetPath) {
            window.location.href = targetPath;
        }
    };

    const login = (userData: Partial<User>, redirectPath?: string) => {
        setUser(userData);

        if (redirectPath) {
            window.location.href = redirectPath;
            return;
        }

        handleRoleRedirect(userData);
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            window.location.href = "/login";
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
                refreshUser: checkAuth,
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
