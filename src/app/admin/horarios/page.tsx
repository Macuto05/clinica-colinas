import Link from "next/link";
import prisma from "@/infrastructure/database/prisma/client";
import { Prisma } from "@prisma/client";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function AdminHorariosPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const { doctor, specialty } = resolvedParams;

    const where: Prisma.MedicoWhereInput = {
        activo: true // Only show active doctors for scheduling
    };

    if (doctor) {
        where.empleado = {
            OR: [
                { nombres: { contains: doctor as string, mode: 'insensitive' } },
                { apellidos: { contains: doctor as string, mode: 'insensitive' } }
            ]
        };
    }

    const doctors = await prisma.medico.findMany({
        where,
        include: {
            empleado: true,
            especialidad: true,
            horario: {
                include: {
                    detalles: true
                }
            }
        },
        orderBy: {
            empleado: {
                apellidos: 'asc'
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Horarios Base</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gestiona la disponibilidad semanal recurrente de los médicos.
                    </p>
                </div>
            </div>

            {/* Filter could go here (reusing DoctorFilter logic ideally) */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doc) => {
                    const fullName = `${doc.empleado.nombres} ${doc.empleado.apellidos}`;
                    const hasSchedule = !!doc.horario;
                    const scheduleCount = doc.horario?.detalles.length || 0;

                    return (
                        <div key={Number(doc.empleadoId)} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 flex flex-col justify-between hover:border-lime-500/50 transition-colors">
                            <div className="mb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-700 dark:text-lime-400 font-bold text-lg">
                                            {doc.empleado.nombres.charAt(0)}{doc.empleado.apellidos.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{fullName}</h3>
                                            <p className="text-sm text-lime-600 font-medium">{doc.especialidad.nombre}</p>
                                        </div>
                                    </div>
                                    {hasSchedule ? (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Configurado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                            Sin Horario
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Clock size={16} className="mr-2" />
                                        {hasSchedule ? (
                                            <span>{scheduleCount} bloque(s) configurado(s)</span>
                                        ) : (
                                            <span>No hay disponibilidad base definida</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 italic">
                                        {hasSchedule
                                            ? "Horario recurrente activo para reserva de citas."
                                            : "El médico no aparecerá disponible para citas web."
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                                <Link href={`/admin/horarios/${doc.empleadoId}`} className="w-full block">
                                    <Button variant="outline" className="w-full">
                                        <Calendar size={16} className="mr-2" />
                                        Gestionar Horario
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {doctors.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No se encontraron médicos</h3>
                        <p>Intenta ajustar los filtros de búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
