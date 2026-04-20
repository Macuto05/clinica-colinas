import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* ─────────────────────────────────────────────────────────
   GET /api/farmacia/solicitudes
   Returns ALL PENDING supply requests (insumos) for the 
   Pharmacy Inbox. Includes patient and emergency info.
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
            where.estadoSolicitud = { in: ["DESPACHADA", "RECHAZADA"] };
        } else {
            where.estadoSolicitud = { in: ["PENDIENTE", "APROBADA"] };
        }

        const solicitudes = await (prisma as any).solicitudInsumo.findMany({
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
                respondedor: {
                    select: { email: true, empleado: { select: { nombres: true, apellidos: true } } },
                },
                detalles: {
                    include: { insumo: { select: { nombre: true, unidadMedida: true, codigo: true } } },
                },
            },
            orderBy: history ? { fechaRespuesta: "desc" as const } : { fechaSolicitud: "desc" as const }
        });

        const mappedSolicitudes = solicitudes.map((s: any) => ({
            solicitudInsumoId: s.solicitudInsumoId.toString(),
            estadoSolicitud:   s.estadoSolicitud,
            fechaSolicitud:    s.fechaSolicitud,
            fechaRespuesta:    s.fechaRespuesta,
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
            respondedor:       s.respondedor?.empleado
                ? `${s.respondedor.empleado.nombres} ${s.respondedor.empleado.apellidos}`
                : s.respondedor?.email || "—",
            insumos: s.detalles.map((d: any) => ({
                solicitudDetalleId: d.solicitudDetalleId.toString(),
                insumoId:           d.insumoId.toString(),
                nombre:             d.insumo.nombre,
                codigo:             d.insumo.codigo,
                unidad:             d.insumo.unidadMedida,
                cantidad:           parseFloat(d.cantidadSolicitada.toString()),
                aprobada:           d.cantidadAprobada ? parseFloat(d.cantidadAprobada.toString()) : 0,
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

        return NextResponse.json(Object.values(groups));

    } catch (error) {
        console.error("Error fetching farmacia solicitudes:", error);
        return NextResponse.json({ error: "Error al cargar solicitudes global de farmacia" }, { status: 500 });
    }
}
