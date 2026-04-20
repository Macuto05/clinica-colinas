import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

/* GET /api/patient/resultados */
export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        // Always use patientId from the verified token — never from query params
        const patientIdStr = payload.patientId;
        if (!patientIdStr) {
            return NextResponse.json({ error: "Paciente no identificado" }, { status: 400 });
        }

        const patientId = BigInt(patientIdStr);

        const documentos = await (prisma as any).documentoClinico.findMany({
            where: {
                cita: { pacienteId: patientId }
            },
            include: {
                cita: { select: { fechaCita: true } },
            },
            orderBy: { fechaRegistro: "desc" }
        });

        // Batch-fetch all related results in 2 queries instead of N+1
        const labIds = documentos.filter((d: any) => d.resultadoId).map((d: any) => d.resultadoId);
        const imgIds = documentos.filter((d: any) => d.resultadoImgId).map((d: any) => d.resultadoImgId);

        const [labResults, imgResults] = await Promise.all([
            labIds.length > 0
                ? (prisma as any).resultadoLaboratorio.findMany({
                    where: { resultadoId: { in: labIds } },
                    include: { detalleLab: { include: { examen: true } } }
                })
                : [],
            imgIds.length > 0
                ? (prisma as any).resultadoImagenologia.findMany({
                    where: { resultadoId: { in: imgIds } },
                    include: { detalleImg: { include: { examen: true } } }
                })
                : [],
        ]);

        const labMap = new Map<string, any>(labResults.map((r: any) => [r.resultadoId.toString(), r]));
        const imgMap = new Map<string, any>(imgResults.map((r: any) => [r.resultadoId.toString(), r]));

        const mapped = documentos.map((doc: any) => {
            let label = "Documento Médico";
            let origen = "Consulta";

            if (doc.resultadoId) {
                const resL = labMap.get(doc.resultadoId.toString());
                if (resL?.detalleLab?.examen?.nombre) {
                    label = resL.detalleLab.examen.nombre;
                    origen = "Laboratorio";
                }
            } else if (doc.resultadoImgId) {
                const resI = imgMap.get(doc.resultadoImgId.toString());
                if (resI?.detalleImg?.examen?.nombre) {
                    label = resI.detalleImg.examen.nombre;
                    origen = "Imagenología";
                }
            } else if (doc.tipoDocumento === "RECETA") {
                label = "Receta Médica";
            } else if (doc.tipoDocumento === "INFORME") {
                label = "Informe Médico";
            }

            return {
                documentoId: doc.documentoId.toString(),
                label,
                origen,
                fecha: doc.fechaRegistro,
                rutaArchivo: doc.rutaArchivo,
                nombreArchivo: doc.nombreArchivo,
                tipoDocumento: doc.tipoDocumento
            };
        });

        return NextResponse.json(mapped);
    } catch (error) {
        console.error("Error fetching patient results:", error);
        return NextResponse.json({ error: "Error de servidor al obtener resultados" }, { status: 500 });
    }
}
