"use client";

import { useState } from "react";
import { MoreVertical, Edit, Trash, Lock } from "lucide-react";
import PatientForm from "./PatientForm";
import { Modal } from "@/components/ui/Modal";

interface PatientActionsProps {
    patient: any; // Type strictly later
}

export default function PatientActions({ patient }: PatientActionsProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showOptions && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowOptions(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-100 dark:border-zinc-700 py-1 z-20">
                        <button
                            onClick={() => {
                                setShowEditModal(true);
                                setShowOptions(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Editar Perfil
                        </button>

                        {/* Future options placeholder */}
                        {/* 
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                    <Trash className="w-4 h-4" />
                    Eliminar
                </button>
                */}
                    </div>
                </>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Paciente"
            >
                <PatientForm
                    initialData={patient}
                    onClose={() => setShowEditModal(false)}
                />
            </Modal>
        </div>
    );
}
