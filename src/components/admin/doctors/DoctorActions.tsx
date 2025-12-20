
"use client";

import { useState } from "react";
import { MoreVertical, Edit, History, CalendarClock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DoctorForm, DoctorFormData } from "./DoctorForm";
import { useRouter } from "next/navigation";

interface DoctorActionsProps {
    doctor: any; // Using any for simplicity with Prisma includes, or define strict type
    specialties: { id: string; nombre: string }[];
}

export function DoctorActions({ doctor, specialties }: DoctorActionsProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    // Map Prisma object to Form Data
    const initialFormData: DoctorFormData = {
        id: doctor.empleado.empleadoId.toString(),
        nombres: doctor.empleado.nombres,
        apellidos: doctor.empleado.apellidos,
        documentoIdentidad: doctor.empleado.documentoIdentidad,
        telefono: doctor.empleado.telefono || "",
        especialidad: doctor.especialidadId.toString(),
        licenciaProfesional: doctor.licenciaProfesional || "",
        numeroColegiatura: doctor.numeroColegiatura || "",
        fechaIngreso: doctor.empleado.fechaIngreso
            ? new Date(doctor.empleado.fechaIngreso).toISOString().split('T')[0]
            : "",
        email: doctor.empleado.usuario?.email || "",
        activo: doctor.activo,
        estadoLaboral: doctor.empleado.estadoLaboral || "ACTIVO",
        usuarioEstado: doctor.empleado.usuario?.estado || "ACTIVO",
    };

    const handleSuccess = () => {
        setIsEditModalOpen(false);
        router.refresh(); // Refresh server component data
    };

    return (
        <>
            <div className="relative inline-block text-left group/menu">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <MoreVertical className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                <div className="hidden group-hover/menu:block absolute right-0 z-10 mt-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700 animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700/50"
                        >
                            <Edit className="mr-3 h-4 w-4 text-gray-400" />
                            Editar Perfil
                        </button>
                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700/50">
                            <History className="mr-3 h-4 w-4 text-gray-400" />
                            Ver Historial y Citas
                        </button>
                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700/50">
                            <CalendarClock className="mr-3 h-4 w-4 text-gray-400" />
                            Modificar Horario
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Médico"
            >
                <DoctorForm
                    initialData={initialFormData}
                    specialties={specialties}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsEditModalOpen(false)}
                />
            </Modal>
        </>
    );
}
