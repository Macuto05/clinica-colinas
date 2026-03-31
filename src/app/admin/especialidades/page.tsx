import CreateSpecialtyButton from "@/components/admin/specialties/CreateSpecialtyButton";
import { SpecialtyActions } from "@/components/admin/specialties/SpecialtyActions";
import { SpecialtyFilter } from "@/components/admin/specialties/SpecialtyFilter";
import prisma from "@/infrastructure/database/prisma/client";
import { Prisma } from "@prisma/client";

export default async function AdminSpecialtiesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const { id, nombre, active } = resolvedParams;

    // Build WhereInput
    const where: Prisma.EspecialidadWhereInput = {};

    if (id) {
        // ID search (exact or verify if user wants partial match string likely partial for simple filter, but IDs are BigInt. 
        // Usually ID filter implies exact match or "starts with" for strings. 
        // Given BigInt, exact match is safest, or we can try to cast.
        // Let's assume exact match if it parses to int, otherwise ignore
        const idNum = parseInt(id as string);
        if (!isNaN(idNum)) {
            where.especialidadId = BigInt(idNum);
        }
    }

    if (nombre) {
        where.nombre = {
            contains: nombre as string,
            mode: 'insensitive',
        };
    }

    if (active && active !== 'ALL') {
        where.activa = active === 'true';
    }

    // Fetch directly from DB with filters
    const specialties = await prisma.especialidad.findMany({
        where,
        orderBy: { especialidadId: 'asc' },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Especialidades</h1>
                    <p className="text-gray-500 font-medium mt-1">Administra el catálogo de especialidades médicas.</p>
                </div>
                <CreateSpecialtyButton />
            </div>

            <SpecialtyFilter />

            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-white/30 border-b border-white/40">
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Especialidad
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">
                                Descripción
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
                        {specialties.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        No se encontraron especialidades que coincidan con los filtros.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            specialties.map((spec) => (
                                <tr key={Number(spec.especialidadId)} className="hover:bg-white/60 transition-colors group">
                                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-gray-500">
                                        #{Number(spec.especialidadId).toString()}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <div className="text-sm font-black text-gray-900 tracking-tight">
                                            {spec.nombre}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-gray-500 max-w-xs truncate">
                                        {spec.descripcion || "—"}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${spec.activa
                                            ? 'bg-green-50/50 text-green-700 border-green-200/50'
                                            : 'bg-red-50/50 text-red-700 border-red-200/50'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${spec.activa ? 'bg-green-500' : 'bg-red-500'}`} />
                                            {spec.activa ? 'ACTIVA' : 'INACTIVA'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-right">
                                        <SpecialtyActions specialty={{
                                            ...spec,
                                            especialidadId: spec.especialidadId.toString()
                                        }} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
