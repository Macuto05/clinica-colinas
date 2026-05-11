import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";
import fs from "fs/promises";
import path from "path";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* ─────────────────────────────────────────────────────────
   POST  /api/imagenologia/solicitudes/[id]
   Process and upload result for a given Imaging Request Details
   Body: 
   { 
     detalleImgId: string, 
     observacionGeneral: string, 
     documentoBase64?: string, 
     nombreArchivo?: string 
   }
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);
        const { detalleImgId, observacionGeneral, documentoBase64, nombreArchivo, documentoUrl } = await req.json();

        if (!detalleImgId) {
            return NextResponse.json({ error: "Detalle de imagenología no proporcionado" }, { status: 400 });
        }

        const solicitud = await (prisma as any).solicitudImagenologia.findUnique({
            where: { solicitudImgId: BigInt(id) },
            include: { 
                detalles: true,
                cita: { include: { emergencia: true } }
            }
        });

        if (!solicitud) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
        }

        const detalle = solicitud.detalles.find((d: any) => d.detalleImgId.toString() === detalleImgId);
        if (!detalle) {
            return NextResponse.json({ error: "Detalle no pertenece a esta solicitud" }, { status: 400 });
        }

        const examen = await (prisma as any).examenImagenologia.findUnique({
            where: { examenId: detalle.examenId }
        });

        let rutaArchivoDb = null;
        let finalNombre = nombreArchivo || "estudio.pdf";

        // If file was already uploaded to Supabase Storage by the client:
        if (documentoUrl) {
            rutaArchivoDb = documentoUrl;
        } 
        // Backward compatibility: Handle File upload if provided
        else if (documentoBase64) {
            const uploadsDir = path.join(process.cwd(), "public", "uploads", "resultados-img");
            await fs.mkdir(uploadsDir, { recursive: true });

            // File extension
            const ext = finalNombre.split('.').pop() || "pdf";
            const uniqueName = `img_${id}_${detalleImgId}_${Date.now()}.${ext}`;
            const diskPath = path.join(uploadsDir, uniqueName);

            // Strip base64 header
            const base64Data = documentoBase64.replace(/^data:([A-Za-z-+/]+);base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            
            await fs.writeFile(diskPath, buffer);
            rutaArchivoDb = `/uploads/resultados-img/${uniqueName}`;
        }

        // Execute DB changes
        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Create result
            const resultado = await tx.resultadoImagenologia.create({
                data: {
                    detalleImgId: BigInt(detalleImgId),
                    observacionGeneral: observacionGeneral || null,
                    usuarioCarga: usuarioId,
                }
            });

            // 2. Attach File
            if (rutaArchivoDb) {
                await tx.documentoClinico.create({
                    data: {
                        resultadoImgId: resultado.resultadoId,
                        citaId:        solicitud.citaId,
                        nombreArchivo: finalNombre,
                        rutaArchivo:   rutaArchivoDb,
                        tipoDocumento: "RESULTADO_LAB"
                    }
                });
            }

            // 3. Create Charge
            if (examen) {
                await tx.cargoCuentaPaciente.create({
                    data: {
                        emergenciaId:     solicitud.cita?.emergencia?.emergenciaId || null,
                        citaId:           solicitud.citaId,
                        tipoCargo:        "EXAMEN", // Maps nicely for both lab/img
                        examenImgId:      examen.examenId,
                        cantidad:         1,
                        usuarioGenerador: usuarioId,
                        estadoCobro:      "PENDIENTE",
                        observaciones:    "Cargo asignado al emitir informe de imagenología"
                    }
                });
            }

            // 4. Status check
            const allDetails = await tx.solicitudImagenologiaDetalle.findMany({
                where: { solicitudImgId: BigInt(id) },
                include: { resultado: true }
            });

            const fullyAttended = allDetails.every((d: any) => 
                d.detalleImgId.toString() === detalleImgId.toString() || d.resultado !== null
            );

            if (fullyAttended) {
                await tx.solicitudImagenologia.update({
                    where: { solicitudImgId: BigInt(id) },
                    data: { estadoSolicitud: "ATENDIDA" }
                });
            } else {
                await tx.solicitudImagenologia.update({
                    where: { solicitudImgId: BigInt(id) },
                    data: { estadoSolicitud: "APROBADA" } 
                });
            }

            return resultado;
        });

        return NextResponse.json({ success: true, resultadoId: result.resultadoId.toString() });
    } catch (error) {
        console.error("Error processing img result:", error);
        return NextResponse.json({ error: "Error de servidor al guardar estudio" }, { status: 500 });
    }
}
