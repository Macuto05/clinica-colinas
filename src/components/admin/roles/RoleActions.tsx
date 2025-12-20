"use client";

import { useState } from "react";
import { MoreVertical, Edit, Trash } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import RoleForm from "./RoleForm";
import { useRouter } from "next/navigation";

interface RoleActionsProps {
    role: any;
}

export default function RoleActions({ role }: RoleActionsProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const router = useRouter();

    const handleSuccess = () => {
        setShowEditModal(false);
        router.refresh();
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar este rol? Esta acción no se puede deshacer y podría afectar a usuarios asignados.")) return;

        try {
            const response = await fetch(`/api/admin/roles/${role.rolId}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                const res = await response.json();
                alert(res.error || "Error al eliminar");
                return;
            }
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
    }

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
                            Editar
                        </button>
                        {/* 
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
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
                title="Editar Rol"
            >
                <RoleForm
                    initialData={role}
                    onSuccess={handleSuccess}
                    onCancel={() => setShowEditModal(false)}
                />
            </Modal>
        </div>
    );
}
