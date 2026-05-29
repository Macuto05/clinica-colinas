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
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-lime-500 text-white rounded-3xl shadow-lg shadow-lime-200/50 -rotate-3">
                        <Shield size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Roles</h1>
                        <p className="text-gray-500 font-medium mt-1">Administra los roles y permisos del sistema.</p>
                    </div>
                </div>
                <CreateRoleButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {roles.map((role) => {
                    const serializedRole = {
                        ...role,
                        rolId: role.rolId.toString(),
                        usuarios: role.usuarios.map(u => ({
                            ...u,
                            usuarioId: u.usuarioId.toString(),
                            rolId: u.rolId.toString(),
                            paciente: u.paciente ? {
                                ...u.paciente,
                                usuarioId: u.paciente.usuarioId?.toString(),
                                pacienteId: u.paciente.pacienteId.toString()
                            } : null,
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
