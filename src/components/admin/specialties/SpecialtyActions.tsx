
"use client";

import { useState } from "react";
import { MoreVertical, Edit } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SpecialtyForm, SpecialtyFormData } from "./SpecialtyForm";
import { useRouter } from "next/navigation";

interface SpecialtyActionsProps {
    specialty: {
        especialidadId: bigint | string; // Handle Prisma BigInt serialization
        nombre: string;
        descripcion: string | null;
        icono: string | null;
        activa: boolean;
    };
}

export function SpecialtyActions({ specialty }: SpecialtyActionsProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    const initialFormData: SpecialtyFormData = {
        id: specialty.especialidadId.toString(),
        nombre: specialty.nombre,
        descripcion: specialty.descripcion || "",
        activa: specialty.activa,
    };

    const handleSuccess = () => {
        setIsEditModalOpen(false);
        router.refresh();
    };

    return (
        <>
            <div className="relative inline-block text-left">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-50"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <div className="absolute right-0 z-50 mt-0 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700 animate-in fade-in zoom-in-95 duration-100">
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Especialidad"
            >
                <SpecialtyForm
                    initialData={initialFormData}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsEditModalOpen(false)}
                />
            </Modal>
        </>
    );
}
