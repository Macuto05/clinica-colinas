"use client";

import { useState } from "react";
import { MoreVertical, Edit } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import StaffForm from "./StaffForm";
import { useRouter } from "next/navigation";

interface StaffActionsProps {
    employee: any; // We'll serialize the employee object
    roles: { id: string; nombre: string }[];
}

export default function StaffActions({ employee, roles }: StaffActionsProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const router = useRouter();

    const handleSuccess = () => {
        setShowEditModal(false);
        router.refresh();
    };

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
                    </div>
                </>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Empleado"
                className="max-w-5xl"
                bodyClassName="p-0"
            >
                <StaffForm
                    roles={roles}
                    initialData={employee}
                    onSuccess={handleSuccess}
                    onCancel={() => setShowEditModal(false)}
                />
            </Modal>
        </div>
    );
}
