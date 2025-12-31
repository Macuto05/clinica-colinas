
"use client";

import { useState } from "react";
import { MoreVertical, Edit, History, CalendarClock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DoctorForm, DoctorFormData } from "./DoctorForm";
import { useRouter } from "next/navigation";

import { ScheduleEditor } from "./ScheduleEditor";

interface DoctorActionsProps {
    doctor: any; // Using any for simplicity with Prisma includes, or define strict type
    specialties: { id: string; nombre: string }[];
}

export function DoctorActions({ doctor, specialties }: DoctorActionsProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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
        router.refresh();
    };

    const handleOpenSchedule = () => {
        // Transform existing schedule to Editor format if available
        if (doctor.horario && doctor.horario.detalles) {
            const daysMap = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
            const mappedSchedule = daysMap.map(day => {
                const dayDetails = doctor.horario.detalles.filter((d: any) => d.diaSemana === day);
                const isActive = dayDetails.length > 0;

                const blocks = dayDetails.map((detail: any) => {
                    // Extract HH:MM from Date string or object
                    const startInfo = new Date(detail.horaInicio);
                    const endInfo = new Date(detail.horaFin); // Assuming valid date objects

                    // Simple formatter
                    const formatTime = (d: Date) => {
                        return d.toISOString().substr(11, 5); // Extract HH:MM if ISO
                    };

                    return {
                        startTime: formatTime(startInfo),
                        endTime: formatTime(endInfo)
                    };
                });

                return {
                    day: day,
                    active: isActive,
                    blocks: isActive ? blocks : []
                };
            });
            setScheduleData(mappedSchedule);
        } else {
            // Let component handle defaults or set empty
            setScheduleData([]);
        }
        setIsScheduleModalOpen(true);
    };

    const handleSaveSchedule = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/doctors/${doctor.empleadoId}/schedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule: scheduleData })
            });

            if (!response.ok) throw new Error("Error al guardar horario");

            setIsScheduleModalOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error al guardar el horario");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="relative inline-block text-left">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <div className="absolute right-0 z-20 mt-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700 animate-in fade-in zoom-in-95 duration-100">
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar Perfil
                                </button>
                                <button
                                    onClick={() => {
                                        handleOpenSchedule();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                                >
                                    <CalendarClock className="w-4 h-4" />
                                    Modificar Horario
                                </button>
                            </div>
                        </div>
                    </>
                )}
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

            {/* Schedule Modal */}
            <Modal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                title="Modificar Horario Base"
            >
                <div className="space-y-6">
                    <div className="p-1">
                        <ScheduleEditor
                            value={scheduleData}
                            onChange={setScheduleData}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-zinc-800">
                        <button
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-600 dark:hover:bg-zinc-700"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveSchedule}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-lime-600 border border-transparent rounded-md hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
