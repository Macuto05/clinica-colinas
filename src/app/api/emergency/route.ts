import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const createEmergencySchema = z.object({
    pacienteId: z.string().min(1, "Paciente es requerido"),
    motivoIngreso: z.string().min(3, "Motivo de ingreso es requerido"),
    nivelUrgencia: z.enum(["CRITICO", "URGENTE", "MODERADO", "LEVE"]).optional(),
    observaciones: z.string().optional().nullable(),
});

// GET — List emergencies
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // TRIAJE, EN_ATENCION, HOSPITALIZADO, etc.
        const active = searchParams.get('active'); // 'true' = only active cases

        const where: any = {};

        if (status) {
            where.estadoEmergencia = status;
        } else if (active === 'true') {
            where.estadoEmergencia = {
                in: ['TRIAJE', 'EN_ATENCION', 'HOSPITALIZADO', 'CIRUGIA_URGENTE']
            };
        }

        const emergencias = await (prisma as any).emergencia.findMany({
            where,
            include: {
                paciente: {
                    select: {
                        nombres: true,
                        apellidos: true,
                        documentoIdentidad: true,
                        telefono: true,
                        polizas: {
                            where: { estado: 'ACTIVA' },
                            include: {
                                aseguradora: { select: { nombre: true } }
                            },
                            take: 1
                        }
                    }
                },
                cartasAval: {
                    include: {
                        poliza: {
                            include: {
                                aseguradora: { select: { nombre: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { fechaIngreso: 'desc' }
        });

        const formatted = emergencias.map((e: any) => {
            const polizaActiva = e.paciente.polizas?.[0] || null;
            return {
                emergenciaId: e.emergenciaId.toString(),
                pacienteId: e.pacienteId.toString(),
                paciente: `${e.paciente.nombres} ${e.paciente.apellidos}`,
                documento: e.paciente.documentoIdentidad || "—",
                telefono: e.paciente.telefono || "—",
                motivoIngreso: e.motivoIngreso,
                nivelUrgencia: e.nivelUrgencia,
                estadoEmergencia: e.estadoEmergencia,
                verificacionPago: e.verificacionPago,
                tipoPago: e.tipoPago,
                fechaIngreso: e.fechaIngreso,
                fechaAlta: e.fechaAlta,
                observaciones: e.observaciones,
                tieneSeguro: !!polizaActiva,
                aseguradora: polizaActiva?.aseguradora?.nombre || null,
                cartasAval: e.cartasAval.map((c: any) => ({
                    cartaAvalId: c.cartaAvalId.toString(),
                    codigoAval: c.codigoAval,
                    montoAprobado: c.montoAprobado ? Number(c.montoAprobado) : null,
                    estado: c.estado,
                    aseguradora: c.poliza?.aseguradora?.nombre || "—",
                    fechaSolicitud: c.fechaSolicitud,
                    fechaRespuesta: c.fechaRespuesta
                }))
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching emergencies:", error);
        return NextResponse.json({ error: "Error al cargar emergencias" }, { status: 500 });
    }
}

// POST — Create emergency admission
export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const result = createEmergencySchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const { pacienteId, motivoIngreso, nivelUrgencia, observaciones } = result.data;
        const pacIdBigInt = BigInt(pacienteId);

        // Verify patient exists
        const paciente = await prisma.paciente.findUnique({
            where: { pacienteId: pacIdBigInt },
            include: {
                polizas: { where: { estado: 'ACTIVA' }, take: 1 }
            }
        });
        if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

        // Determine initial payment verification based on insurance
        const tieneSeguro = (paciente as any).polizas?.length > 0;

        const emergencia = await (prisma as any).emergencia.create({
            data: {
                pacienteId: pacIdBigInt,
                motivoIngreso,
                nivelUrgencia: nivelUrgencia || 'MODERADO',
                estadoEmergencia: 'TRIAJE',
                verificacionPago: 'PENDIENTE',
                tipoPago: tieneSeguro ? 'ASEGURADO' : 'PENDIENTE',
                observaciones: observaciones || null,
            }
        });

        return NextResponse.json({
            success: true,
            emergencia: {
                emergenciaId: emergencia.emergenciaId.toString(),
                tieneSeguro
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating emergency:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
