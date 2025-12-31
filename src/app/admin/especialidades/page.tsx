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

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                    <thead className="bg-gray-50 dark:bg-zinc-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Nombre
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Descripción
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
                        {specialties.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                    No se encontraron especialidades que coincidan con los filtros.
                                </td>
                            </tr>
                        ) : (
                            specialties.map((spec) => (
                                <tr key={Number(spec.especialidadId)} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 group">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        #{Number(spec.especialidadId).toString()}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {spec.nombre}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {spec.descripcion || "-"}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${spec.activa
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {spec.activa ? 'ACTIVA' : 'INACTIVA'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
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
