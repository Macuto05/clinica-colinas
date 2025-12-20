"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import StaffForm from "./StaffForm";
import { useRouter } from "next/navigation";

interface CreateStaffButtonProps {
    roles: { id: string; nombre: string }[];
}

export default function CreateStaffButton({ roles }: CreateStaffButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleSuccess = () => {
        setIsModalOpen(false);
        router.refresh();
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
            >
                <Plus size={20} />
                <span>Nuevo Empleado</span>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Nuevo Empleado"
            >
                <StaffForm
                    onSuccess={handleSuccess}
                    onCancel={() => setIsModalOpen(false)}
                    roles={roles}
                />
            </Modal>
        </>
    );
}
