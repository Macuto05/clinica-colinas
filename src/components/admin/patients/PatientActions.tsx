"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Edit, Shield } from "lucide-react";
import PatientForm from "./PatientForm";
import { Modal } from "@/components/ui/Modal";
import PatientInsuranceSection from "@/components/insurance/PatientInsuranceSection";

interface PatientActionsProps {
    patient: any;
}

const MENU_W = 192; // w-48
const MENU_H = 112; // ~2 items × ~44px + padding
const GAP    = 6;

export default function PatientActions({ patient }: PatientActionsProps) {
    const [showOptions,        setShowOptions]        = useState(false);
    const [showEditModal,      setShowEditModal]      = useState(false);
    const [showInsuranceModal, setShowInsuranceModal] = useState(false);
    const [menuPos,            setMenuPos]            = useState({ top: 0, left: 0 });
    const [mounted,            setMounted]            = useState(false);

    useEffect(() => { setMounted(true); }, []);

    /* ── YouTube-style positioning via Portal ───────────────────────
       Portal renders at document.body → never clipped by
       backdrop-filter / overflow:hidden ancestors.
    ─────────────────────────────────────────────────────────────── */
    const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
        const r = e.currentTarget.getBoundingClientRect();

        // Right-align menu to the button
        const left = Math.max(8, r.right - MENU_W);

        // Open below; flip above if not enough room
        const spaceBelow = window.innerHeight - r.bottom;
        const top = spaceBelow >= MENU_H + GAP
            ? r.bottom + GAP
            : r.top - MENU_H - GAP;

        setMenuPos({ top, left });
        setShowOptions(true);
    };

    const dropdown = showOptions && mounted && createPortal(
        <>
            {/* Backdrop */}
            <div
                style={{ position: "fixed", inset: 0, zIndex: 9998 }}
                onClick={() => setShowOptions(false)}
            />
            {/* Menu */}
            <div
                style={{
                    position: "fixed",
                    top:   menuPos.top,
                    left:  menuPos.left,
                    width: MENU_W,
                    zIndex: 9999,
                }}
                className="rounded-2xl bg-white border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden"
            >
                <div className="py-1">
                    <button
                        onClick={() => { setShowEditModal(true); setShowOptions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                        <Edit className="w-4 h-4 text-gray-400 shrink-0" />
                        Editar Perfil
                    </button>
                    <button
                        onClick={() => { setShowInsuranceModal(true); setShowOptions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                        <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                        Seguros Médicos
                    </button>
                </div>
            </div>
        </>,
        document.body,
    );

    return (
        <>
            {/* Trigger */}
            <button
                onClick={handleOpenMenu}
                className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown portal */}
            {dropdown}

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Paciente">
                <PatientForm initialData={patient} onClose={() => setShowEditModal(false)} />
            </Modal>

            {/* Insurance Modal */}
            <Modal
                isOpen={showInsuranceModal}
                onClose={() => setShowInsuranceModal(false)}
                title={`Seguros Médicos — ${patient.nombres} ${patient.apellidos}`}
            >
                <PatientInsuranceSection pacienteId={patient.pacienteId} />
            </Modal>
        </>
    );
}
