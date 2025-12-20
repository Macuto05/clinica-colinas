import Link from "next/link";
import prisma from "@/infrastructure/database/prisma/client";
import { Plus } from "lucide-react";
import PatientActions from "@/components/admin/patients/PatientActions";
import CreatePatientButton from "@/components/admin/patients/CreatePatientButton";

import PatientFilter from "@/components/admin/patients/PatientFilter";
import { Prisma } from "@prisma/client";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPatientsPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;

    // Filters
    const idFilter = resolvedSearchParams.id as string;
    const searchFilter = resolvedSearchParams.search as string; // Name search
    const docFilter = resolvedSearchParams.doc as string;
    const statusFilter = resolvedSearchParams.status as string;
    const userStatusFilter = resolvedSearchParams.userStatus as string;

    const where: Prisma.PacienteWhereInput = {};

    if (idFilter) {
        // Try parsing BigInt
        try {
            where.pacienteId = BigInt(idFilter);
        } catch {
            // If invalid ID format, maybe return empty or ignore.
            // For safety let's force a no-match if ID is definitely invalid for BigInt, 
            // but Prisma might throw if we pass a weird string to BigInt.
            // Let's just ignore if validation fails
        }
    }

    if (searchFilter) {
        where.OR = [
            { nombres: { contains: searchFilter, mode: 'insensitive' } },
            { apellidos: { contains: searchFilter, mode: 'insensitive' } },
        ];
    }

    if (docFilter) {
        where.documentoIdentidad = { contains: docFilter, mode: 'insensitive' };
    }

    if (statusFilter && statusFilter !== 'ALL') {
        where.estado = statusFilter as any;
    }

    if (userStatusFilter && userStatusFilter !== 'ALL') {
        where.usuario = {
            estado: userStatusFilter as any
        };
    }

    // 1. Fetch patients
    const patients = await prisma.paciente.findMany({
        where,
        orderBy: { apellidos: 'asc' },
        include: {
            usuario: {
                select: { email: true, estado: true }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Pacientes</h1>
                    <p className="text-gray-500 dark:text-gray-400">Administra el registro clínico de los pacientes.</p>
                </div>
                {/* Create Button */}
                <CreatePatientButton />
            </div>

            <PatientFilter />

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                    <thead className="bg-gray-50 dark:bg-zinc-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Paciente
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Documento
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Estado Paciente
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Estado Usuario
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                        {patients.map((patient) => {
                            const fullName = `${patient.nombres} ${patient.apellidos}`;

                            // Serialize BigInts for client components
                            const serializedPatient = {
                                ...patient,
                                pacienteId: patient.pacienteId.toString(),
                                usuarioId: patient.usuarioId?.toString() || null,
                                usuario: patient.usuario ? {
                                    ...patient.usuario,
                                    // usuarioId is typically not needed here but good practice if recursive
                                } : null
                            };

                            return (
                                <tr key={Number(patient.pacienteId)} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 group">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        #{Number(patient.pacienteId).toString().padStart(4, '0')}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{fullName}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {patient.documentoIdentidad || "Sin documento"}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${patient.estado === 'ACTIVO'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {patient.estado}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {patient.usuario ? (
                                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${patient.usuario.estado === 'ACTIVO'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {patient.usuario.estado}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No registrado</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                        <PatientActions patient={serializedPatient} />
                                    </td>
                                </tr>
                            );
                        })}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-gray-500">
                                    No hay pacientes registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
