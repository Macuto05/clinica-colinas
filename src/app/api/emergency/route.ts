import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const createEmergencySchema = z.object({
    pacienteId:    z.string().min(1, "Paciente es requerido"),
    motivoIngreso: z.string().min(3, "Motivo de ingreso es requerido"),
    nivelUrgencia: z.enum(["CRITICO", "URGENTE", "MODERADO", "LEVE"]).optional(),
    observaciones: z.string().optional().nullable(),
});

/* ──────────────────────────────────────────────────────────
   GET  /api/emergency
   Query params:
     active=true          → EN_ATENCION | HOSPITALIZADO | CIRUGIA_URGENTE
     status=XXX           → exact state
     status=XXX&status2=YYY → two states (e.g. ALTA + ATENDIDO for "closed")
────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const status  = searchParams.get("status");
        const status2 = searchParams.get("status2");
        const active  = searchParams.get("active");
        let patientId = searchParams.get("patientId");

        const userRole = (payload as any).role;
        if (userRole === "PACIENTE") {
            const tokenPatientId = (payload as any).patientId;
            if (tokenPatientId) {
                // Fast path: token already has patientId
                patientId = tokenPatientId.toString();
            } else {
                // Fallback: look up the patient linked to this userId in DB
                const rawUserId = (payload as any).userId ?? (payload as any).sub;
                if (!rawUserId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
                const userRecord = await prisma.usuario.findUnique({
                    where: { usuarioId: BigInt(rawUserId) },
                    include: { paciente: { select: { pacienteId: true } } },
                });
                if (!userRecord?.paciente) {
                    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
                }
                patientId = userRecord.paciente.pacienteId.toString();
            }
        }

        const where: any = {};
        if (patientId) {
            where.pacienteId = BigInt(patientId);
        }

        if (status && status2) {
            where.estadoEmergencia = { in: [status, status2] };
        } else if (status) {
            where.estadoEmergencia = status;
        } else if (active === "true") {
            where.estadoEmergencia = { in: ["EN_ATENCION", "HOSPITALIZADO", "CIRUGIA_URGENTE"] };
        }

        const emergencias = await (prisma as any).emergencia.findMany({
            where,
            include: {
                paciente: {
                    select: {
                        nombres: true, apellidos: true,
                        documentoIdentidad: true, telefono: true,
                        polizas: {
                            where: { estado: "ACTIVA" },
                            include: { aseguradora: { select: { nombre: true } } },
                            take: 1,
                        },
                    },
                },
                cita: {
                    select: {
                        _count: {
                            select: {
                                solicitudesLab: true,
                                solicitudesImg: true,
                            }
                        }
                    }
                },
                medico: {
                    include: {
                        empleado:    { select: { nombres: true, apellidos: true } },
                        especialidad: { select: { nombre: true } },
                    },
                },
                cartasAval: {
                    include: {
                        poliza: { include: { aseguradora: { select: { nombre: true } } } },
                    },
                },
            },
            orderBy: { fechaIngreso: "desc" },
        });

        const formatted = emergencias.map((e: any) => {
            const pol = e.paciente.polizas?.[0] || null;
            return {
                emergenciaId:     e.emergenciaId.toString(),
                pacienteId:       e.pacienteId.toString(),
                citaId:           e.citaId?.toString() || null,
                paciente:         `${e.paciente.nombres} ${e.paciente.apellidos}`,
                documento:        e.paciente.documentoIdentidad || "—",
                telefono:         e.paciente.telefono || "—",
                motivoIngreso:    e.motivoIngreso,
                nivelUrgencia:    e.nivelUrgencia,
                estadoEmergencia: e.estadoEmergencia,
                verificacionPago: e.verificacionPago,
                tipoPago:         e.tipoPago,
                fechaIngreso:     e.fechaIngreso,
                fechaAlta:        e.fechaAlta,
                observaciones:    e.observaciones,
                tieneExamenes:    (e.cita?._count?.solicitudesLab ?? 0) + (e.cita?._count?.solicitudesImg ?? 0) > 0,
                tieneSeguro:      !!pol,
                aseguradora:      pol?.aseguradora?.nombre || null,
                medico: e.medico ? {
                    medicoId:     e.medico.empleadoId.toString(),
                    nombre:       `${e.medico.empleado.nombres} ${e.medico.empleado.apellidos}`,
                    especialidad: e.medico.especialidad?.nombre || "—",
                } : null,
                cartasAval: e.cartasAval.map((c: any) => ({
                    cartaAvalId:    c.cartaAvalId.toString(),
                    codigoAval:     c.codigoAval,
                    estado:         c.estado,
                    aseguradora:    c.poliza?.aseguradora?.nombre || "—",
                    fechaSolicitud: c.fechaSolicitud,
                    fechaRespuesta: c.fechaRespuesta,
                })),
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching emergencies:", error);
        return NextResponse.json({ error: "Error al cargar emergencias" }, { status: 500 });
    }
}

/* ──────────────────────────────────────────────────────────
   POST  /api/emergency
   Creates:  1) CitaMedica (tipo=EMERGENCIA) + 2) Emergencia
   Both are created in a single transaction so they are always
   properly linked.
────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body   = await req.json();
        const result = createEmergencySchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const { pacienteId, motivoIngreso, nivelUrgencia, observaciones } = result.data;
        const pacIdBigInt = BigInt(pacienteId);
        const rawUserId = (payload as any).userId ?? (payload as any).sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);

        // Verify patient
        const paciente = await prisma.paciente.findUnique({
            where: { pacienteId: pacIdBigInt },
            include: { polizas: { where: { estado: "ACTIVA" }, take: 1 } },
        });
        if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

        const tieneSeguro = (paciente as any).polizas?.length > 0;

        // Pick any active medico to satisfy the NOT NULL FK on cita_medica.
        // When the receptionist later assigns the real doctor to the emergency,
        // we update the cita's medicoId as well.
        const anyMedico = await (prisma as any).medico.findFirst({ where: { activo: true } });

        const now        = new Date();
        const horaFin    = new Date(now.getTime() + 60 * 60 * 1000); // +1h placeholder

        const emergencia = await (prisma as any).$transaction(async (tx: any) => {
            let citaId: bigint | null = null;

            if (anyMedico) {
                // Add a random millisecond offset (0–9999ms) so simultaneous emergencies
                // never collide on the uq_cita_slot constraint (medicoId+fechaCita+horaInicio).
                // Retry up to 3 times with different offsets.
                let citaCreated = false;
                for (let attempt = 0; attempt < 3; attempt++) {
                    const offsetMs = Math.floor(Math.random() * 9999);
                    const horaInicioUnique = new Date(now.getTime() + offsetMs);
                    const horaFinUnique    = new Date(horaInicioUnique.getTime() + 60 * 60 * 1000);

                    try {
                        const cita = await tx.citaMedica.create({
                            data: {
                                pacienteId:      pacIdBigInt,
                                medicoId:        anyMedico.empleadoId,
                                fechaCita:       horaInicioUnique,
                                horaInicio:      horaInicioUnique,
                                horaFin:         horaFinUnique,
                                motivoConsulta:  motivoIngreso,
                                estadoCita:      "PROGRAMADA",
                                tipoCita:        "EMERGENCIA",
                                origenCita:      "RECEPCION",
                                usuarioCreacion: usuarioId,
                                observaciones:   "Cita generada automáticamente por ingreso de emergencia",
                            },
                        });
                        citaId = cita.citaId;
                        citaCreated = true;
                        break;
                    } catch (slotError: any) {
                        // Only retry on unique constraint violations (P2002)
                        if (slotError?.code === "P2002" && attempt < 2) {
                            continue;
                        }
                        console.error(`[Emergency] CitaMedica creation failed (attempt ${attempt + 1}):`, slotError?.message);
                        break;
                    }
                }

                if (!citaCreated) {
                    console.warn(
                        `[Emergency] WARN: Could not create CitaMedica for patient ${pacienteId}. ` +
                        `Emergency will have citaId=null — billing will be blocked until manually fixed.`
                    );
                }
            }

            return tx.emergencia.create({
                data: {
                    pacienteId:       pacIdBigInt,
                    citaId:           citaId,
                    motivoIngreso,
                    nivelUrgencia:    nivelUrgencia || "MODERADO",
                    estadoEmergencia: "EN_ATENCION",
                    verificacionPago: "PENDIENTE",
                    tipoPago:         tieneSeguro ? "ASEGURADO" : "PENDIENTE",
                    observaciones:    observaciones || null,
                },
            });
        });

        return NextResponse.json({
            success: true,
            emergencia: {
                emergenciaId: emergencia.emergenciaId.toString(),
                citaId:       emergencia.citaId?.toString() || null,
                tieneSeguro,
            },
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating emergency:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
