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
        orderBy: { pacienteId: 'asc' },
        include: {
            usuario: {
                select: { email: true, estado: true }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Pacientes</h1>
                    <p className="text-gray-500 font-medium mt-1">Administra el registro clínico de los pacientes.</p>
                </div>
                {/* Create Button */}
                <CreatePatientButton />
            </div>

            <PatientFilter />

            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-white/30 border-b border-white/40">
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Paciente
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Documento
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Estado Paciente
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Estado Usuario
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                        {patients.map((patient) => {
                            const fullName = `${patient.nombres} ${patient.apellidos}`;

                            // Serialize BigInts for client components
                            const serializedPatient = {
                                ...patient,
                                pacienteId: patient.pacienteId.toString(),
                                usuarioId: patient.usuarioId?.toString() || null,
                                usuario: patient.usuario ? {
                                    ...patient.usuario,
                                } : null
                            };

                            return (
                                <tr key={Number(patient.pacienteId)} className="hover:bg-white/60 transition-colors group">
                                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-gray-500">
                                        #{Number(patient.pacienteId).toString().padStart(4, '0')}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <div className="text-sm font-black text-gray-900 tracking-tight">{fullName}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-gray-500">
                                        {patient.documentoIdentidad || "Sin documento"}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${patient.estado === 'ACTIVO'
                                            ? 'bg-green-50/50 text-green-700 border-green-200/50'
                                            : 'bg-red-50/50 text-red-700 border-red-200/50'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${patient.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            {patient.estado}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        {patient.usuario ? (
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${patient.usuario.estado === 'ACTIVO'
                                                ? 'bg-blue-50/50 text-blue-700 border-blue-200/50'
                                                : 'bg-gray-50/50 text-gray-700 border-gray-200/50'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${patient.usuario.estado === 'ACTIVO' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                {patient.usuario.estado}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No registrado</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-right">
                                        <PatientActions patient={serializedPatient} />
                                    </td>
                                </tr>
                            );
                        })}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        No hay pacientes registrados que coincidan con los filtros.
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
