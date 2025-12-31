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
    const { id, doctor, specialty, active } = resolvedParams;

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


    const doctors = await prisma.medico.findMany({
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
        }
    });

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
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Gestión de Médicos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Administra los perfiles médicos y su información.
                    </p>
                </div>
                <CreateDoctorButton specialties={serializedSpecialties} />
            </div>

            <DoctorFilter specialties={serializedSpecialties} />

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                    <thead className="bg-gray-50 dark:bg-zinc-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                ID (Emp)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Doctor
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Especialidad
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
                        {doctors.map((doctor) => {
                            // Helper to get full name safely
                            const fullName = `${doctor.empleado.nombres} ${doctor.empleado.apellidos}`;
                            const empId = doctor.empleadoId;

                            return (
                                <tr key={Number(doctor.empleadoId)} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 group">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        #{Number(empId).toString().padStart(4, '0')}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center">

                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{fullName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
                                            {doctor.especialidad.nombre}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${doctor.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>
                                            {doctor.activo ? "ACTIVO" : "INACTIVO"}
                                        </span>
                                    </td>
                                    <td className="relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <DoctorActions doctor={doctor} specialties={serializedSpecialties} />
                                    </td>
                                </tr>
                            );
                        })}
                        {doctors.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                    No se encontraron médicos que coincidan con los filtros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
