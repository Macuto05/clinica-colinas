
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DoctorForm } from "@/components/admin/doctors/DoctorForm";
import { useRouter } from "next/navigation";

interface CreateDoctorButtonProps {
    specialties: { id: string; nombre: string }[];
}

export function CreateDoctorButton({ specialties }: CreateDoctorButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleSuccess = () => {
        setIsModalOpen(false);
        // Refresh the page to show new doctor
        router.refresh();
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-lime-700 transition"
            >
                <Plus className="h-4 w-4" />
                Nuevo Médico
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Nuevo Médico"
            >
                <DoctorForm
                    onSuccess={handleSuccess}
                    onCancel={() => setIsModalOpen(false)}
                    specialties={specialties}
                />
            </Modal>
        </>
    );
}
