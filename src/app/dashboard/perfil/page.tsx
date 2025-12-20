"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="relative h-32 bg-gradient-to-r from-[#a1db4b] to-teal-500">
                    <div className="absolute -bottom-12 left-8">
                        <div className="h-24 w-24 rounded-full bg-white dark:bg-zinc-900 p-1">
                            <div className="h-full w-full rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                                <User size={40} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Información Personal
                            </h3>

                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Cédula de Identidad</p>
                                    <p className="font-medium">{user.idCard || "No registrada"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Fecha de Nacimiento</p>
                                    <p className="font-medium">
                                        {user.birthDate
                                            ? new Date(user.birthDate).toLocaleDateString()
                                            : "No registrada"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Información de Contacto
                            </h3>

                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Teléfono</p>
                                    <p className="font-medium">{user.phone || "No registrado"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Dirección</p>
                                    <p className="font-medium">{user.address || "No registrada"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
