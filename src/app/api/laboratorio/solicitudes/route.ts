import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* ─────────────────────────────────────────────────────────
   GET /api/laboratorio/solicitudes
   Returns ALL PENDING lab requests for the Lab Inbox. 
   Includes patient and emergency info.
───────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const history = searchParams.get("history") === "true";
        const groupByPatient = searchParams.get("group") === "patient";
        const statusParam = searchParams.get("status");

        let where: any = {};
        if (statusParam) {
            where.estadoSolicitud = statusParam;
        } else if (history) {
            where.estadoSolicitud = { in: ["ATENDIDA", "RECHAZADA"] };
        } else {
            where.estadoSolicitud = { in: ["PENDIENTE", "APROBADA"] };
        }

        const solicitudes = await (prisma as any).solicitudLaboratorio.findMany({
            where,
            include: {
                cita: {
                    include: {
                        paciente: {
                            select: { pacienteId: true, nombres: true, apellidos: true, documentoIdentidad: true }
                        },
                        emergencia: {
                            select: { emergenciaId: true, nivelUrgencia: true }
                        }
                    }
                },
                solicitante: {
                    select: { email: true, empleado: { select: { nombres: true, apellidos: true } } },
                },
                detalles: {
                    include: { 
                        examen: { select: { nombre: true } },
                        resultado: { include: { documentos: true } }
                    },
                },
            },
            orderBy: { fechaSolicitud: "desc" as const }
        });

        const mappedSolicitudes = solicitudes.map((s: any) => ({
            solicitudLabId:    s.solicitudLabId.toString(),
            estadoSolicitud:   s.estadoSolicitud,
            fechaSolicitud:    s.fechaSolicitud,
            observaciones:     s.observaciones,
            pacienteId: s.cita?.paciente?.pacienteId?.toString() || "unknown",
            paciente: s.cita?.paciente 
                ? `${s.cita.paciente.nombres} ${s.cita.paciente.apellidos}`
                : "Paciente Desconocido",
            cedula: s.cita?.paciente?.documentoIdentidad || "—",
            emergenciaId: s.cita?.emergencia?.emergenciaId?.toString() || null,
            triage: (function(urgency: string) {
                switch(urgency) {
                    case 'CRITICO': return 'ROJO';
                    case 'URGENTE': return 'NARANJA';
                    case 'MODERADO': return 'AMARILLO';
                    case 'LEVE': return 'VERDE';
                    default: return 'NORMAL';
                }
            })(s.cita?.emergencia?.nivelUrgencia || ''),
            solicitante:       s.solicitante?.empleado
                ? `${s.solicitante.empleado.nombres} ${s.solicitante.empleado.apellidos}`
                : s.solicitante?.email || "—",
            examenes: s.detalles.map((d: any) => ({
                detalleLabId: d.detalleLabId.toString(),
                examenId:     d.examenId.toString(),
                nombre:       d.examen.nombre,
                atendido:     !!d.resultado,
                documentoUrl: d.resultado?.documentos?.rutaArchivo || null
            })),
        }));

        if (!groupByPatient) {
            return NextResponse.json(mappedSolicitudes);
        }

        // Grouping logic
        const groups: Record<string, any> = {};
        mappedSolicitudes.forEach((s: any) => {
            const pid = s.pacienteId;
            if (!groups[pid]) {
                groups[pid] = {
                    pacienteId: pid,
                    pacienteNombre: s.paciente,
                    cedula: s.cedula,
                    emergenciaId: s.emergenciaId,
                    triage: s.triage,
                    solicitudes: []
                };
            }
            groups[pid].solicitudes.push(s);
        });

        const sortedGroups = Object.values(groups).sort((a: any, b: any) => {
            const aLatest = Math.max(...a.solicitudes.map((s: any) => new Date(s.fechaSolicitud).getTime()));
            const bLatest = Math.max(...b.solicitudes.map((s: any) => new Date(s.fechaSolicitud).getTime()));
            return bLatest - aLatest;
        });

        return NextResponse.json(sortedGroups);

    } catch (error) {
        console.error("Error fetching lab solicitudes:", error);
        return NextResponse.json({ error: "Error al cargar solicitudes de laboratorio" }, { status: 500 });
    }
}
