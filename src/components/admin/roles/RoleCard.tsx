"use client";

import { useState } from "react";
import { Shield, Users } from "lucide-react";
import RoleActions from "./RoleActions";
import RoleUsersModal from "./RoleUsersModal";

interface RoleCardProps {
    role: any;
}

export default function RoleCard({ role }: RoleCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);

    // Filter users list from the role object (assuming it's passed populated)
    const users = role.usuarios || [];

    return (
        <>
            <div
                className="group relative bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 transition-all duration-300 hover:shadow-lg hover:border-lime-200 dark:hover:border-lime-900/50 hover:-translate-y-1 cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setShowUsersModal(true)}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg transition-colors duration-300 ${isHovered ? 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400' : 'bg-gray-50 text-gray-500 dark:bg-zinc-800'}`}>
                        <Shield size={20} />
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                        <RoleActions role={role} />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                    {role.nombre}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-10 line-clamp-2">
                    {role.descripcion || "Sin descripción"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider group-hover:text-lime-600/70 transition-colors">Usuarios Asignados</span>
                    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-zinc-800 group-hover:bg-lime-50 dark:group-hover:bg-lime-900/20 text-gray-700 dark:text-gray-300 group-hover:text-lime-700 dark:group-hover:text-lime-300 rounded-md transition-colors">
                        <Users size={14} />
                        <span className="text-xs font-bold">
                            {users.length}
                        </span>
                    </div>
                </div>
            </div>

            <RoleUsersModal
                isOpen={showUsersModal}
                onClose={() => setShowUsersModal(false)}
                roleName={role.nombre}
                users={users}
            />
        </>
    );
}
