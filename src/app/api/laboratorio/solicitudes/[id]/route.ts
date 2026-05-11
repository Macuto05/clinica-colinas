import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";
import fs from "fs/promises";
import path from "path";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* ─────────────────────────────────────────────────────────
   POST  /api/laboratorio/solicitudes/[id]
   Process and upload result for a given Lab Request Details
   Body: 
   { 
     detalleLabId: string, 
     observacionGeneral: string, 
     documentoBase64?: string, 
     nombreArchivo?: string 
   }
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params; // solicitudLabId
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);
        const { detalleLabId, observacionGeneral, documentoBase64, nombreArchivo, documentoUrl } = await req.json();

        if (!detalleLabId) {
            return NextResponse.json({ error: "Detalle de laboratorio no proporcionado" }, { status: 400 });
        }

        const solicitud = await (prisma as any).solicitudLaboratorio.findUnique({
            where: { solicitudLabId: BigInt(id) },
            include: { 
                detalles: true,
                cita: { include: { emergencia: true } }
            }
        });

        if (!solicitud) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
        }

        const detalle = solicitud.detalles.find((d: any) => d.detalleLabId.toString() === detalleLabId);
        if (!detalle) {
            return NextResponse.json({ error: "Detalle no pertenece a esta solicitud" }, { status: 400 });
        }

        const examen = await (prisma as any).examenLaboratorio.findUnique({
            where: { examenId: detalle.examenId }
        });

        let rutaArchivoDb = null;
        let finalNombre = nombreArchivo || "resultado.pdf";

        // If file was already uploaded to Supabase Storage by the client:
        if (documentoUrl) {
             rutaArchivoDb = documentoUrl;
        } 
        // Backward compatibility: Handle Base64 File upload if provided
        else if (documentoBase64) {
            const uploadsDir = path.join(process.cwd(), "public", "uploads", "resultados-lab");
            await fs.mkdir(uploadsDir, { recursive: true });

            // File extension
            const ext = finalNombre.split('.').pop() || "pdf";
            const uniqueName = `lab_${id}_${detalleLabId}_${Date.now()}.${ext}`;
            const diskPath = path.join(uploadsDir, uniqueName);

            // Strip base64 header if present (e.g. data:application/pdf;base64,...)
            const base64Data = documentoBase64.replace(/^data:([A-Za-z-+/]+);base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            
            await fs.writeFile(diskPath, buffer);
            rutaArchivoDb = `/uploads/resultados-lab/${uniqueName}`; // Public URL accessible from browser
        }

        // Execute DB changes
        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Create result
            const resultado = await tx.resultadoLaboratorio.create({
                data: {
                    detalleLabId: BigInt(detalleLabId),
                    observacionGeneral: observacionGeneral || null,
                    usuarioCarga: usuarioId,
                }
            });

            // 2. Attach File
            if (rutaArchivoDb) {
                await tx.documentoClinico.create({
                    data: {
                        resultadoId:   resultado.resultadoId,
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
                        tipoCargo:        "EXAMEN",
                        examenLabId:      examen.examenId,
                        cantidad:         1,
                        usuarioGenerador: usuarioId,
                        estadoCobro:      "PENDIENTE",
                        observaciones:    "Cargo asignado al emitir resultado de laboratorio"
                    }
                });
            }

            // 4. Mark solicitides as ATENDIDA if all details have results
            // (Count the un-resulted details for this request)
            const allDetails = await tx.solicitudLaboratorioDetalle.findMany({
                where: { solicitudLabId: BigInt(id) },
                include: { resultado: true }
            });

            // Is all attended?
            const fullyAttended = allDetails.every((d: any) => 
                d.detalleLabId.toString() === detalleLabId.toString() || d.resultado !== null
            );

            if (fullyAttended) {
                await tx.solicitudLaboratorio.update({
                    where: { solicitudLabId: BigInt(id) },
                    data: { estadoSolicitud: "ATENDIDA" }
                });
            } else {
                await tx.solicitudLaboratorio.update({
                    where: { solicitudLabId: BigInt(id) },
                    data: { estadoSolicitud: "APROBADA" } // En proceso
                });
            }

            return resultado;
        });

        return NextResponse.json({ success: true, resultadoId: result.resultadoId.toString() });
    } catch (error) {
        console.error("Error processing lab result:", error);
        return NextResponse.json({ error: "Error de servidor al guardar resultado" }, { status: 500 });
    }
}
