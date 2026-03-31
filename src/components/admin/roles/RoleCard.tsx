"use client";

import { useState } from "react";
import { Shield, Users, Award, Package, Stethoscope, Pill, Headset, ShieldCheck, User } from "lucide-react";
import RoleActions from "./RoleActions";
import RoleUsersModal from "./RoleUsersModal";

interface RoleCardProps {
    role: any;
}

const roleIcons: { [key: string]: React.ElementType } = {
    "ADMIN": ShieldCheck,
    "MEDICO": Award,
    "PACIENTE": Users,
    "ENFERMERIA": Stethoscope,
    "FARMACIA": Pill,
    "ALMACEN": Package,
    "RECEPCION": Headset,
};

export default function RoleCard({ role }: RoleCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);

    // Filter users list from the role object (assuming it's passed populated)
    const users = role.usuarios || [];

    const IconComponent = roleIcons[role.nombre] || Shield;

    const isActive = role.activo !== false; // Default to true if undefined, though schema says default true

    return (
        <>
            <div
                className={`group relative bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] cursor-pointer hover:scale-[1.02] active:scale-95
                ${isActive
                        ? 'hover:border-lime-400/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.02)]'
                        : 'opacity-70 hover:opacity-100 hover:border-red-400/50 shadow-none'
                    }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setShowUsersModal(true)}
            >
                {/* Status Indicator Chip */}
                <div className="absolute top-6 right-16">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        isActive 
                        ? 'bg-lime-50/50 text-lime-600 border-lime-200/50' 
                        : 'bg-red-50/50 text-red-600 border-red-200/50'
                    }`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>

                <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-3xl transition-all duration-500 shadow-sm
                        ${isActive
                            ? (isHovered ? 'bg-lime-500 text-white shadow-lime-200/50 rotate-6 scale-110' : 'bg-white/60 text-lime-600 border border-white/50')
                            : 'bg-red-50/50 text-red-500 border border-red-200/50'
                        }`}>
                        <IconComponent size={24} strokeWidth={2.5} />
                    </div>

                    <div onClick={(e) => e.stopPropagation()} className="relative z-10">
                        <RoleActions role={role} />
                    </div>
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight group-hover:text-lime-600 transition-colors">
                    {role.nombre}
                </h3>
                <p className="text-sm font-medium text-gray-500 mb-6 h-10 line-clamp-2 leading-relaxed">
                    {role.descripcion || "Sin descripción establecida para este rol del sistema."}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/40">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Usuarios Asignados</span>
                    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/60 border border-white/50 text-gray-700 rounded-2xl shadow-sm group-hover:bg-lime-50/80 transition-all">
                        <Users size={14} strokeWidth={3} className="text-lime-600" />
                        <span className="text-xs font-black">
                            {users.length}
                        </span>
                    </div>
                </div>

                {/* Decorative background glow on hover */}
                {isActive && (
                    <div className="absolute inset-0 -z-10 bg-lime-400/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />
                )}
            </div>

            <RoleUsersModal
                isOpen={showUsersModal}
                onClose={() => setShowUsersModal(false)}
                roleName={role.nombre}
                users={users}
                icon={IconComponent}
            />
        </>
    );
}
