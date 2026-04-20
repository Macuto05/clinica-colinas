
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

export async function POST(req: NextRequest) {
    try {
        // SEC-09: Extract userId from JWT token, not from body
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);

        const body = await req.json();
        const {
            citaId,
            diagnostico, // { descripcion, notas }
            receta, // { detalles: [{ medicamento, dosis, frecuencia, duracion, instrucciones }] }
            ordenes // [{ estudio, tipo }]
        } = body;

        if (!citaId || !diagnostico) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Verify Ownership
        const doctor = await prisma.medico.findFirst({
            where: { empleado: { usuarioId } }
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

        // Transaction: Save Diagnosis + Prescription + Orders + Update Status
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Diagnosis
            const newDiagnosis = await tx.diagnostico.create({
                data: {
                    citaId: BigInt(citaId),
                    descripcion: diagnostico.descripcion,
                    notas: diagnostico.notas,
                    usuarioId
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

            // 3. Create Orders (Laboratory / Radiology)
            if (ordenes && ordenes.length > 0) {
                for (const order of ordenes) {
                    const tipoNormalizado = order.tipo?.toLowerCase() || "";
                    if (tipoNormalizado.includes("lab")) {
                        // Find or Create Exam record
                        let examen = await tx.examenLaboratorio.findFirst({
                            where: { nombre: { equals: order.estudio, mode: 'insensitive' } }
                        });
                        if (!examen) {
                            examen = await tx.examenLaboratorio.create({ data: { nombre: order.estudio, precio: 0 } });
                        }
                        // Create Request
                        await tx.solicitudLaboratorio.create({
                            data: {
                                citaId: BigInt(citaId),
                                usuarioSolicita: usuarioId,
                                detalles: {
                                    create: { examenId: examen.examenId }
                                }
                            }
                        });
                    } else if (tipoNormalizado.includes("img") || tipoNormalizado.includes("rayo") || tipoNormalizado.includes("eco")) {
                        // Find or Create Exam record
                        let examen = await tx.examenImagenologia.findFirst({
                            where: { nombre: { equals: order.estudio, mode: 'insensitive' } }
                        });
                        if (!examen) {
                            examen = await tx.examenImagenologia.create({ data: { nombre: order.estudio, precio: 0 } });
                        }
                        // Create Request
                        await tx.solicitudImagenologia.create({
                            data: {
                                citaId: BigInt(citaId),
                                usuarioSolicita: usuarioId,
                                detalles: {
                                    create: { examenId: examen.examenId }
                                }
                            }
                        });
                    }
                }
            }

            // 4. Update Appointment Status
            await tx.citaMedica.update({
                where: { citaId: BigInt(citaId) },
                data: { estadoCita: 'ATENDIDA' }
            });
            return { newDiagnosis, newPrescription };
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error saving clinical record:", error);
        // SEC-06: Return proper 500 status, don't expose internal error details
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
