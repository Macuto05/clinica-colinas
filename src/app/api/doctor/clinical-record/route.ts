
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function POST(req: Request) {
    try {
        console.log("--- API START: /api/doctor/clinical-record ---");
        const body = await req.json();
        console.log("Request Body:", JSON.stringify(body, null, 2));

        const {
            citaId,
            usuarioId, // Doctor's User ID
            diagnostico, // { descripcion, notas }
            receta, // { detalles: [{ medicamento, dosis, frecuencia, duracion, instrucciones }] }
            ordenes // [{ estudio, tipo }]
        } = body;

        if (!citaId || !usuarioId || !diagnostico) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Verify Ownership
        const doctor = await prisma.medico.findFirst({
            where: { empleado: { usuarioId: BigInt(usuarioId) } }
        });

        if (!doctor) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const appointment = await prisma.citaMedica.findUnique({
            where: { citaId: BigInt(citaId) }
        });

        if (!appointment || appointment.medicoId !== doctor.empleadoId) {
            return NextResponse.json({ error: "Cita no encontrada o no asignada" }, { status: 404 });
        }

        // Transaction: Save Diagnosis + Prescription + Update Status
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Diagnosis
            const newDiagnosis = await tx.diagnostico.create({
                data: {
                    citaId: BigInt(citaId),
                    descripcion: diagnostico.descripcion,
                    notas: diagnostico.notas,
                    usuarioId: BigInt(usuarioId)
                }
            });

            // 2. Create Prescription (if provided)
            let newPrescription = null;
            if (receta && receta.detalles && receta.detalles.length > 0) {
                newPrescription = await tx.receta.create({
                    data: {
                        citaId: BigInt(citaId),
                        detalles: {
                            create: receta.detalles.map((d: any) => ({
                                medicamento: d.medicamento,
                                dosis: d.dosis,
                                frecuencia: d.frecuencia,
                                duracion: d.duracion,
                                instrucciones: d.instrucciones
                            }))
                        }
                    }
                });
            }

            // 3. Update Appointment Status
            await tx.citaMedica.update({
                where: { citaId: BigInt(citaId) },
                data: { estadoCita: 'ATENDIDA' }
            });

            // 4. Create Medical Orders (if provided)
            let newOrders = null;
            if (ordenes && ordenes.length > 0) {
                // @ts-ignore
                newOrders = await tx.ordenMedica.createMany({
                    data: ordenes.map((o: any) => ({
                        citaId: BigInt(citaId),
                        tipo: o.tipo || "Examen",
                        estudio: o.estudio,
                        fechaCreacion: new Date()
                    }))
                });
            }

            return { newDiagnosis, newPrescription, newOrders };


        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error saving clinical record:", error);
        return NextResponse.json({ success: false, error: `Error interno: ${(error as any).message}` }, { status: 200 });
    }
}
