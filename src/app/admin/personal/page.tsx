import prisma from "@/infrastructure/database/prisma/client";
import CreateStaffButton from "@/components/admin/staff/CreateStaffButton";
import StaffActions from "@/components/admin/staff/StaffActions";

export default async function AdminStaffPage() {
    // Fetch roles for the form, excluding MEDICO, PACIENTE, and ADMIN (usually admin creates other specific roles)
    // Or maybe keep ADMIN if they want to create admins. Let's exclude MEDICO and PACIENTE as requested.
    const roles = await prisma.rol.findMany({
        where: { nombre: { notIn: ['MEDICO', 'PACIENTE'] }, activo: true },
        orderBy: { nombre: 'asc' }
    });

    const serializedRoles = roles.map(r => ({
        id: r.rolId.toString(),
        nombre: r.nombre
    }));

    // 1. Fetch staff (Employees who are NOT doctors)
    const staff = await prisma.empleado.findMany({
        where: {
            medico: null // Exclude doctors
        },
        include: {
            usuario: {
                include: {
                    rol: true
                }
            }
        },
        orderBy: { apellidos: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Personal</h1>
                <CreateStaffButton roles={serializedRoles} />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                    <thead className="bg-gray-50 dark:bg-zinc-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Nombre
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Rol
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Documento
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Estado
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                        {staff.map((employee) => {
                            // Serialize for client component
                            const serializedEmployee = {
                                ...employee,
                                empleadoId: employee.empleadoId.toString(),
                                usuarioId: employee.usuarioId ? employee.usuarioId.toString() : null,
                                fechaIngreso: employee.fechaIngreso ? employee.fechaIngreso.toISOString() : null,
                                usuario: employee.usuario ? {
                                    ...employee.usuario,
                                    usuarioId: employee.usuario.usuarioId.toString(),
                                    rolId: employee.usuario.rolId.toString(),
                                    rol: employee.usuario.rol ? {
                                        ...employee.usuario.rol,
                                        rolId: employee.usuario.rol.rolId.toString()
                                    } : null
                                } : null
                            };

                            return (
                                <tr key={Number(employee.empleadoId)} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {employee.nombres} {employee.apellidos}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                                            {employee.usuario?.rol?.nombre || "Sin Rol"}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {employee.documentoIdentidad}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${employee.estadoLaboral === 'ACTIVO'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {employee.estadoLaboral}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <StaffActions employee={serializedEmployee} roles={serializedRoles} />
                                    </td>
                                </tr>
                            );
                        })}
                        {staff.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                    No hay personal registrado (excluyendo médicos).
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
