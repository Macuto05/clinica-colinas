import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

interface PatchBody {
    status?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = BigInt(params.id);
        const body: PatchBody = await req.json();
        const { status, date, startTime, endTime, reason } = body;

        const updateData: any = {};

        // Status Map
        if (status) {
            updateData.estadoCita = status;
        }

        if (reason) {
            updateData.observaciones = reason;
        }

        // Reschedule Map
        if (date && startTime && endTime) {
            // Parse Date (YYYY-MM-DD)
            // Note: DB expects DateTime object for @db.Date
            updateData.fechaCita = new Date(date);

            // Parse Time (HH:MM)
            // Note: DB expects DateTime object for @db.Time
            // We use an arbitrary date for the Time object as Prisma/Postgres Time ignores the date part
            const dummyDate = '1970-01-01';
            updateData.horaInicio = new Date(`${dummyDate}T${startTime}:00Z`);
            updateData.horaFin = new Date(`${dummyDate}T${endTime}:00Z`);

            // If rescheduling, we usually verify conflicts again, but for now we proceed.
        }

        const updated = await prisma.citaMedica.update({
            where: { citaId: id },
            data: updateData
        });

        // Automate Debt Cancellation
        if (status && ['CANCELADA', 'NO_ASISTIO'].includes(status)) {
            const factura = await prisma.factura.findUnique({
                where: { citaId: id }
            });

            if (factura && factura.estadoFactura === 'PENDIENTE') {
                await prisma.factura.update({
                    where: { facturaId: factura.facturaId },
                    data: {
                        estadoFactura: 'ANULADA',
                        saldoPendiente: 0,
                        observaciones: factura.observaciones
                            ? `${factura.observaciones} | Anulada por cancelación de cita`
                            : `Anulada automáticamente por estado de cita: ${status}`
                    }
                });
            }
        }

        // Serialization for BigInt
        return NextResponse.json({
            id: updated.citaId.toString(),
            status: updated.estadoCita
        });

    } catch (error) {
        console.error("Error updating appointment:", error);
        return NextResponse.json({
            error: "Error al actualizar cita",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
