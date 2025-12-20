import prisma from "@/infrastructure/database/prisma/client";
import CreateRoleButton from "@/components/admin/roles/CreateRoleButton";
import RoleCard from "@/components/admin/roles/RoleCard";
import { Shield } from "lucide-react";

export default async function AdminRolesPage() {
    const roles = await prisma.rol.findMany({
        orderBy: { nombre: 'asc' },
        include: {
            usuarios: {
                include: {
                    empleado: {
                        include: {
                            medico: true
                        }
                    },
                    paciente: true
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lime-100 dark:bg-lime-900/30 rounded-lg text-lime-600 dark:text-lime-400">
                        <Shield size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Roles</h1>
                </div>
                <CreateRoleButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => {
                    const serializedRole = {
                        ...role,
                        rolId: role.rolId.toString(),
                        usuarios: role.usuarios.map(u => ({
                            ...u,
                            usuarioId: u.usuarioId.toString(),
                            rolId: u.rolId.toString(),
                            // Serialize paciente
                            paciente: u.paciente ? {
                                ...u.paciente,
                                usuarioId: u.paciente.usuarioId?.toString(),
                                pacienteId: u.paciente.pacienteId.toString()
                            } : null,
                            // Serialize empleado and nested medico
                            empleado: u.empleado ? {
                                ...u.empleado,
                                usuarioId: u.empleado.usuarioId?.toString(),
                                empleadoId: u.empleado.empleadoId.toString(),
                                fechaIngreso: u.empleado.fechaIngreso ? new Date(u.empleado.fechaIngreso).toISOString() : null,
                                medico: u.empleado.medico ? {
                                    ...u.empleado.medico,
                                    empleadoId: u.empleado.medico.empleadoId.toString(),
                                    especialidadId: u.empleado.medico.especialidadId.toString()
                                } : null
                            } : null
                        }))
                    };
                    return (
                        <RoleCard key={serializedRole.rolId} role={serializedRole} />
                    );
                })}
            </div>
        </div>
    );
}
