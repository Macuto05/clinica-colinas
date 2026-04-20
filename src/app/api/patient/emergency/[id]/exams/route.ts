import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

/* GET /api/patient/emergency/[id]/exams
   Returns lab and imaging orders with per-exam download links,
   linked to the CitaMedica auto-created for this emergency.
*/
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await context.params;
        const emergenciaId = BigInt(id);

        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId },
            select: { citaId: true, pacienteId: true }
        });

        if (!emergencia) {
            return NextResponse.json({ error: "Emergencia no encontrada" }, { status: 404 });
        }

        if (payload.role === "PACIENTE") {
            const paciente = await (prisma as any).paciente.findUnique({
                where: { usuarioId: BigInt(payload.userId) },
                select: { pacienteId: true }
            });
            if (!paciente || paciente.pacienteId !== emergencia.pacienteId) {
                return NextResponse.json({ error: "No autorizado" }, { status: 403 });
            }
        }

        if (!emergencia.citaId) {
            return NextResponse.json({ citaId: null, hasExams: false, solicitudesLab: [], solicitudesImg: [] });
        }

        const citaId = emergencia.citaId;

        const [solicitudesLab, solicitudesImg] = await Promise.all([
            (prisma as any).solicitudLaboratorio.findMany({
                where: { citaId },
                include: {
                    detalles: {
                        include: {
                            examen: { select: { nombre: true } },
                            resultado: {
                                include: {
                                    documentos: { select: { rutaArchivo: true, nombreArchivo: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { fechaSolicitud: "asc" }
            }),
            (prisma as any).solicitudImagenologia.findMany({
                where: { citaId },
                include: {
                    detalles: {
                        include: {
                            examen: { select: { nombre: true } },
                            resultado: {
                                include: {
                                    documentos: { select: { rutaArchivo: true, nombreArchivo: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { fechaSolicitud: "asc" }
            })
        ]);

        const formattedLab = solicitudesLab.map((s: any) => ({
            solicitudLabId: s.solicitudLabId.toString(),
            estado:         s.estadoSolicitud,
            fechaSolicitud: s.fechaSolicitud,
            observaciones:  s.observaciones,
            examenes: s.detalles.map((d: any) => ({
                nombre:        d.examen?.nombre ?? "Examen sin nombre",
                rutaArchivo:   d.resultado?.documentos?.rutaArchivo   ?? null,
                nombreArchivo: d.resultado?.documentos?.nombreArchivo ?? null,
            }))
        }));

        const formattedImg = solicitudesImg.map((s: any) => ({
            solicitudImgId: s.solicitudImgId.toString(),
            estado:         s.estadoSolicitud,
            fechaSolicitud: s.fechaSolicitud,
            observaciones:  s.observaciones,
            examenes: s.detalles.map((d: any) => ({
                nombre:        d.examen?.nombre ?? "Examen sin nombre",
                rutaArchivo:   d.resultado?.documentos?.rutaArchivo   ?? null,
                nombreArchivo: d.resultado?.documentos?.nombreArchivo ?? null,
            }))
        }));

        const hasExams = formattedLab.length > 0 || formattedImg.length > 0;

        return NextResponse.json({
            citaId: citaId.toString(),
            hasExams,
            solicitudesLab: formattedLab,
            solicitudesImg: formattedImg,
        });

    } catch (error) {
        console.error("Error fetching emergency exams:", error);
        return NextResponse.json({ error: "Error al obtener exámenes" }, { status: 500 });
    }
}
