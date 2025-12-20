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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Especialidades</h1>
                    <p className="text-gray-500 dark:text-gray-400">Administra el catálogo de especialidades médicas.</p>
                </div>
                <CreateSpecialtyButton />
            </div>

            <SpecialtyFilter />

            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left bg-white dark:bg-zinc-900">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Icono</th>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Descripción</th>
                            <th className="px-6 py-4">Activa</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 border-t border-gray-100 dark:border-zinc-800">
                        {specialties.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No se encontraron especialidades que coincidan con los filtros.
                                </td>
                            </tr>
                        ) : (
                            specialties.map((spec) => (
                                <tr key={Number(spec.especialidadId)} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">#{Number(spec.especialidadId)}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-700 dark:text-lime-400 text-lg">
                                            {/* We render the icon char or a placeholder */}
                                            {spec.icono || "💊"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {spec.nombre}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {spec.descripcion || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${spec.activa
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {spec.activa ? 'ACTIVA' : 'INACTIVA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* Pass serialized ID manually if needed, or component handles it */}
                                        <SpecialtyActions specialty={{
                                            ...spec,
                                            // Handle bigints serialization strictly if passed to client component, 
                                            // though Actions component takes 'bigint | string' type for ID locally. 
                                            // Better to pass string to avoid serialization warnings.
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
