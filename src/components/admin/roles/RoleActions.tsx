"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import RoleForm from "./RoleForm";
import { useRouter } from "next/navigation";

interface RoleActionsProps {
    role: any;
}

export default function RoleActions({ role }: RoleActionsProps) {
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
                onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                title="Editar Rol"
            >
                <Edit size={18} />
            </button>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Rol"
                className="max-w-md"
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
