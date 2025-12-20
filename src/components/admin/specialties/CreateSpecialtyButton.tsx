
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { SpecialtyForm } from "./SpecialtyForm";

export default function CreateSpecialtyButton() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleSuccess = () => {
        setIsOpen(false);
        router.refresh(); // Refresh server component data
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm transition-transform active:scale-95"
            >
                <Plus size={20} />
                <span>Nueva Especialidad</span>
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Nueva Especialidad"
            >
                <SpecialtyForm
                    onSuccess={handleSuccess}
                    onCancel={() => setIsOpen(false)}
                />
            </Modal>
        </>
    );
}
