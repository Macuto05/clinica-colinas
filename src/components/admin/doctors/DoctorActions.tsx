"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Edit, CalendarClock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DoctorForm, DoctorFormData } from "./DoctorForm";
import { useRouter } from "next/navigation";
import { ScheduleEditor } from "./ScheduleEditor";

interface DoctorActionsProps {
    doctor: any;
    specialties: { id: string; nombre: string }[];
}

const MENU_W = 208; // w-52
const MENU_H = 104; // approx height for 2 items
const GAP    = 6;

export function DoctorActions({ doctor, specialties }: DoctorActionsProps) {
    const [isMenuOpen,          setIsMenuOpen]          = useState(false);
    const [isEditModalOpen,     setIsEditModalOpen]     = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleData,        setScheduleData]        = useState<any[]>([]);
    const [isSaving,            setIsSaving]            = useState(false);
    const [menuPos,             setMenuPos]             = useState({ top: 0, left: 0 });
    // Portal requires the DOM to be mounted
    const [mounted,             setMounted]             = useState(false);
    const router = useRouter();

    useEffect(() => { setMounted(true); }, []);

    const initialFormData: DoctorFormData = {
        id:                  doctor.empleado.empleadoId.toString(),
        nombres:             doctor.empleado.nombres,
        apellidos:           doctor.empleado.apellidos,
        documentoIdentidad:  doctor.empleado.documentoIdentidad,
        telefono:            doctor.empleado.telefono || "",
        especialidad:        doctor.especialidadId.toString(),
        licenciaProfesional: doctor.licenciaProfesional || "",
        numeroColegiatura:   doctor.numeroColegiatura || "",
        fechaIngreso:        doctor.empleado.fechaIngreso
            ? new Date(doctor.empleado.fechaIngreso).toISOString().split("T")[0]
            : "",
        email:               doctor.empleado.usuario?.email || "",
        activo:              doctor.activo,
        estadoLaboral:       doctor.empleado.estadoLaboral || "ACTIVO",
        usuarioEstado:       doctor.empleado.usuario?.estado || "ACTIVO",
    };

    const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Use the button's real viewport coordinates
        const r = e.currentTarget.getBoundingClientRect();

        // Horizontal: right-align menu to the button
        const left = Math.max(8, r.right - MENU_W);

        // Vertical: open below; flip above if there's not enough space
        const spaceBelow = window.innerHeight - r.bottom;
        const top = spaceBelow >= MENU_H + GAP
            ? r.bottom + GAP          // open downward
            : r.top - MENU_H - GAP;   // open upward

        setMenuPos({ top, left });
        setIsMenuOpen(true);
    };

    const handleSuccess = () => { setIsEditModalOpen(false); router.refresh(); };

    const handleOpenSchedule = () => {
        if (doctor.horario?.detalles) {
            const days = ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES","SABADO","DOMINGO"];
            setScheduleData(days.map(day => {
                const det = doctor.horario.detalles.filter((d: any) => d.diaSemana === day);
                const fmt = (dt: Date) => dt.toISOString().substr(11, 5);
                return {
                    day,
                    active: det.length > 0,
                    blocks: det.map((d: any) => ({
                        startTime: fmt(new Date(d.horaInicio)),
                        endTime:   fmt(new Date(d.horaFin)),
                    })),
                };
            }));
        } else {
            setScheduleData([]);
        }
        setIsScheduleModalOpen(true);
    };

    const handleSaveSchedule = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/doctors/${doctor.empleadoId}/schedule`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule: scheduleData }),
            });
            if (!res.ok) throw new Error();
            setIsScheduleModalOpen(false);
            router.refresh();
        } catch {
            alert("Error al guardar el horario");
        } finally {
            setIsSaving(false);
        }
    };

    /* ─── Dropdown via Portal ────────────────────────────────────────
       Rendered at document.body so it is never affected by any
       backdrop-filter / overflow:hidden ancestor (which would otherwise
       break position:fixed or clip the element).
    ─────────────────────────────────────────────────────────────── */
    const dropdown = isMenuOpen && mounted && createPortal(
        <>
            {/* Full-screen backdrop to close on outside click */}
            <div
                style={{ position: "fixed", inset: 0, zIndex: 9998 }}
                onClick={() => setIsMenuOpen(false)}
            />
            {/* Menu panel */}
            <div
                style={{
                    position: "fixed",
                    top:      menuPos.top,
                    left:     menuPos.left,
                    width:    MENU_W,
                    zIndex:   9999,
                }}
                className="rounded-2xl bg-white border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden"
            >
                <div className="py-1">
                    <button
                        onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                        <Edit className="w-4 h-4 text-gray-400 shrink-0" />
                        Editar Perfil
                    </button>
                    <button
                        onClick={() => { handleOpenSchedule(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                        <CalendarClock className="w-4 h-4 text-gray-400 shrink-0" />
                        Modificar Horario
                    </button>
                </div>
            </div>
        </>,
        document.body,
    );

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={handleOpenMenu}
                className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
                <MoreVertical className="h-5 w-5" />
            </button>

            {/* Dropdown portal */}
            {dropdown}

            {/* Edit modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Médico">
                <DoctorForm
                    initialData={initialFormData}
                    specialties={specialties}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsEditModalOpen(false)}
                />
            </Modal>

            {/* Schedule modal */}
            <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Modificar Horario Base">
                <div className="space-y-6">
                    <ScheduleEditor value={scheduleData} onChange={setScheduleData} />
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveSchedule}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-lime-600 rounded-lg hover:bg-lime-700 disabled:opacity-50"
                        >
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
