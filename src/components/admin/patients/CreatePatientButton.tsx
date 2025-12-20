"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import PatientForm from "./PatientForm";
import { useRouter } from "next/navigation";

export default function CreatePatientButton() {
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
                className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
            >
                <Plus size={20} />
                <span>Nuevo Paciente</span>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Nuevo Paciente"
            >
                <PatientForm
                    onSuccess={handleSuccess}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </>
    );
}
