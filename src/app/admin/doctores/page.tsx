import Link from "next/link";
import prisma from "@/infrastructure/database/prisma/client";
import { CreateDoctorButton } from "@/components/admin/doctors/CreateDoctorButton";
import { DoctorActions } from "@/components/admin/doctors/DoctorActions";
import { DoctorFilter } from "@/components/admin/doctors/DoctorFilter";
import { Prisma } from "@prisma/client";

export default async function AdminDoctorsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const { id, doctor, specialty, active, page: pageParam } = resolvedParams;

    // Pagination
    const page = Math.max(1, parseInt(pageParam as string) || 1);
    const pageSize = 10;

    // Build WhereInput
    const where: Prisma.MedicoWhereInput = {};

    if (id) {
        // ID search (numeric ID of employee)
        const idNum = parseInt(id as string);
        if (!isNaN(idNum)) {
            where.empleadoId = BigInt(idNum);
        }
    }

    if (doctor) {
        // Search by First Name OR Last Name
        where.empleado = {
            OR: [
                { nombres: { contains: doctor as string, mode: 'insensitive' } },
                { apellidos: { contains: doctor as string, mode: 'insensitive' } }
            ]
        };
    }

    if (specialty && specialty !== 'ALL') {
        const specId = parseInt(specialty as string);
        if (!isNaN(specId)) {
            where.especialidadId = BigInt(specId);
        }
    }

    if (active && active !== 'ALL') {
        where.activo = active === 'true';
    }

    // Get total count and paginated data
    const [total, doctors] = await Promise.all([
        prisma.medico.count({ where }),
        prisma.medico.findMany({
            where,
            include: {
                empleado: {
                    include: {
                        usuario: true
                    }
                },
                especialidad: true,
                horario: {
                    include: {
                        detalles: true
                    }
                }
            },
            orderBy: {
                empleadoId: 'asc'
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    // Fetch active specialties for the dropdown and filter
    const specialtiesData = await prisma.especialidad.findMany({
        where: { activa: true },
        orderBy: { nombre: 'asc' },
        select: { especialidadId: true, nombre: true }
    });

    const serializedSpecialties = specialtiesData.map(s => ({
        id: s.especialidadId.toString(),
        nombre: s.nombre
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Gestión de Médicos
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Administra los perfiles médicos y su información.
                    </p>
                </div>
                <CreateDoctorButton specialties={serializedSpecialties} />
            </div>

            <DoctorFilter specialties={serializedSpecialties} />

            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-white/30 border-b border-white/40">
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                ID (Emp)
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Doctor
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Especialidad
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
                        {doctors.map((doctor) => {
                            const fullName = `${doctor.empleado.nombres} ${doctor.empleado.apellidos}`;
                            const empId = doctor.empleadoId;

                            return (
                                <tr key={Number(doctor.empleadoId)} className="hover:bg-white/60 transition-colors group">
                                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-gray-500">
                                        #{Number(empId).toString().padStart(4, '0')}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <div className="text-sm font-black text-gray-900 tracking-tight">{fullName}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200/50 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {doctor.especialidad.nombre}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${
                                            doctor.activo 
                                                ? 'bg-green-50/50 text-green-700 border-green-200/50' 
                                                : 'bg-red-50/50 text-red-700 border-red-200/50'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${doctor.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                                            {doctor.activo ? "ACTIVO" : "INACTIVO"}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-right">
                                        <DoctorActions doctor={doctor} specialties={serializedSpecialties} />
                                    </td>
                                </tr>
                            );
                        })}
                        {doctors.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        No se encontraron médicos que coincidan con los filtros.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {doctors.length > 0 && (
                    <div className="bg-white/20 px-6 py-4 flex items-center justify-between border-t border-white/40">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                            Página {page} de {totalPages} ({total} total)
                        </p>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link
                                    href={`/admin/doctores?${new URLSearchParams({ ...Object.fromEntries(Object.entries(resolvedParams).filter(([k]) => k !== 'page')), page: (page - 1).toString() }).toString()}`}
                                    className="px-4 py-2 rounded-lg bg-white/50 border border-white/60 hover:bg-white/70 transition-colors text-sm font-bold"
                                >
                                    ← Anterior
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/admin/doctores?${new URLSearchParams({ ...Object.fromEntries(Object.entries(resolvedParams).filter(([k]) => k !== 'page')), page: (page + 1).toString() }).toString()}`}
                                    className="px-4 py-2 rounded-lg bg-white/50 border border-white/60 hover:bg-white/70 transition-colors text-sm font-bold"
                                >
                                    Siguiente →
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
