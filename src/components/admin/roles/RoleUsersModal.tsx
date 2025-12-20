"use client";

import { Modal } from "@/components/ui/Modal";
import { User, Stethoscope, HeartPulse, Shield } from "lucide-react";

interface RoleUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleName: string;
    users: any[];
}

export default function RoleUsersModal({ isOpen, onClose, roleName, users }: RoleUsersModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Usuarios con rol: ${roleName}`}
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay usuarios asignados a este rol.</p>
                ) : (
                    <div className="grid gap-3">
                        {users.map((user) => {
                            // Determine user type and display info
                            let name = "Usuario del Sistema";
                            let identifier = user.email;
                            let Icon = Shield;
                            let additionalInfo = "";

                            if (user.empleado?.medico) {
                                name = `${user.empleado.nombres} ${user.empleado.apellidos}`;
                                Icon = Stethoscope;
                                additionalInfo = "Médico";
                            } else if (user.paciente) {
                                name = `${user.paciente.nombres} ${user.paciente.apellidos}`;
                                Icon = HeartPulse;
                                additionalInfo = "Paciente";
                            } else if (user.empleado) {
                                name = `${user.empleado.nombres} ${user.empleado.apellidos}`;
                                Icon = User;
                                additionalInfo = "Personal";
                            }

                            return (
                                <div key={user.usuarioId} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700">
                                    <div className="p-2 bg-white dark:bg-zinc-700 rounded-full shadow-sm text-lime-600 dark:text-lime-400">
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{identifier}</span>
                                            {additionalInfo && (
                                                <>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    <span>{additionalInfo}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}
