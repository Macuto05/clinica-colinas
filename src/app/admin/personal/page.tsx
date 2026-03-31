import prisma from "@/infrastructure/database/prisma/client";
import CreateStaffButton from "@/components/admin/staff/CreateStaffButton";
import StaffActions from "@/components/admin/staff/StaffActions";
import StaffFilter from "@/components/admin/staff/StaffFilter";
import { Prisma } from "@prisma/client";
import { $Enums } from "@prisma/client";

export default async function AdminStaffPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const { id, search, document, role, status } = resolvedParams;

    // Fetch roles
    const roles = await prisma.rol.findMany({
        where: { nombre: { notIn: ['MEDICO', 'PACIENTE'] }, activo: true },
        orderBy: { nombre: 'asc' }
    });

    const serializedRoles = roles.map(r => ({
        id: r.rolId.toString(),
        nombre: r.nombre
    }));

    // Build WhereInput
    const where: Prisma.EmpleadoWhereInput = {
        medico: null // Always exclude doctors
    };

    if (id) {
        const idNum = parseInt(id as string);
        if (!isNaN(idNum)) {
            where.empleadoId = BigInt(idNum);
        }
    }

    if (search) {
        where.OR = [
            { nombres: { contains: search as string, mode: 'insensitive' } },
            { apellidos: { contains: search as string, mode: 'insensitive' } }
        ];
    }

    if (document) {
        where.documentoIdentidad = { contains: document as string, mode: 'insensitive' };
    }

    if (role && role !== 'ALL') {
        const roleId = parseInt(role as string);
        if (!isNaN(roleId)) {
            where.usuario = {
                rolId: BigInt(roleId)
            };
        }
    }

    if (status && status !== 'ALL') {
        where.estadoLaboral = status as $Enums.EmpleadoEstadoLaboral;
    }

    // 1. Fetch staff with filters
    const staff = await prisma.empleado.findMany({
        where,
        include: {
            usuario: {
                include: {
                    rol: true
                }
            }
        },
        orderBy: { empleadoId: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Personal</h1>
                    <p className="text-gray-500 font-medium mt-1">Administra la lista de empleados.</p>
                </div>
                <CreateStaffButton roles={serializedRoles} />
            </div>

            <StaffFilter roles={serializedRoles} />

            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-white/30 border-b border-white/40">
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                ID (EMP)
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Nombre
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Rol
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Documento
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Estado
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
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
                                <tr key={Number(employee.empleadoId)} className="hover:bg-white/60 transition-colors group">
                                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-gray-500">
                                        #{Number(employee.empleadoId).toString().padStart(4, '0')}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <div className="text-sm font-black text-gray-900 tracking-tight">
                                            {employee.nombres} {employee.apellidos}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200/50 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {employee.usuario?.rol?.nombre || "Sin Rol"}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-gray-500">
                                        {employee.documentoIdentidad}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${employee.estadoLaboral === 'ACTIVO'
                                            ? 'bg-green-50/50 text-green-700 border-green-200/50'
                                            : 'bg-yellow-50/50 text-yellow-700 border-yellow-200/50'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${employee.estadoLaboral === 'ACTIVO' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                            {employee.estadoLaboral}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-right">
                                        <StaffActions employee={serializedEmployee} roles={serializedRoles} />
                                    </td>
                                </tr>
                            );
                        })}
                        {staff.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        No hay personal registrado (excluyendo médicos).
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
