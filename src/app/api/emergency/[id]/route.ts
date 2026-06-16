import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";
import { logAuditoria } from "@/infrastructure/services/AuditService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const updateSchema = z.object({
    estadoEmergencia: z.enum(["EN_ATENCION", "HOSPITALIZADO", "CIRUGIA_URGENTE", "REFERIDO", "ALTA", "ATENDIDO"]).optional(),
    verificacionPago: z.enum(["PENDIENTE", "CONFIRMADO", "SIN_COBERTURA"]).optional().nullable(),
    tipoPago: z.enum(["PARTICULAR", "ASEGURADO", "PENDIENTE"]).optional().nullable(),
    observaciones: z.string().optional().nullable(),
    nivelUrgencia: z.enum(["CRITICO", "URGENTE", "MODERADO", "LEVE"]).optional().nullable(),
    medicoId: z.string().optional().nullable(),
    cartaAval: z.object({
        cartaAvalId: z.string().optional().nullable(),
        polizaId: z.string(),
        codigoAval: z.string().optional().nullable(),
        estado: z.string(),
        observaciones: z.string().optional().nullable()
    }).optional().nullable()
});

// GET — Get emergency detail
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId: BigInt(id) },
            include: {
                paciente: {
                    include: {
                        polizas: {
                            where: { estado: 'ACTIVA' },
                            include: { aseguradora: true }
                        }
                    }
                },
                medico: {
                    include: {
                        empleado: { select: { nombres: true, apellidos: true } },
                        especialidad: { select: { nombre: true } }
                    }
                },
                cartasAval: {
                    include: {
                        poliza: { include: { aseguradora: true } }
                    },
                    orderBy: { fechaSolicitud: 'desc' }
                },
                cita: {
                    include: {
                        factura: true
                    }
                }
            }
        });

        if (!emergencia) {
            return NextResponse.json({ error: "Emergencia no encontrada" }, { status: 404 });
        }

        // Serialize
        const serialized = JSON.parse(JSON.stringify(emergencia, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error("Error fetching emergency:", error);
        return NextResponse.json({ error: "Error al cargar emergencia" }, { status: 500 });
    }
}

// PUT — Update emergency status
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await context.params;
        const body = await req.json();
        const result = updateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const data: any = { ...result.data };

        // Process Carta Aval locally
        const cartaAvalData = data.cartaAval;
        delete data.cartaAval; // Remove so Prisma doesn't crash updating Emergencia

        // Convert medicoId string to BigInt if provided
        if (data.medicoId !== undefined) {
            data.medicoId = data.medicoId ? BigInt(data.medicoId) : null;
        }

        // CRITICAL: Track if we're ONLY updating CartaAval (not changing emergency status)
        // If yes, skip the automatic billing consolidation logic entirely
        const isOnlyUpdatingCartaAval = cartaAvalData && !data.estadoEmergencia;

        // Auto-set fechaAlta when status is ALTA, ATENDIDO or REFERIDO
        if (data.estadoEmergencia === 'ALTA' || data.estadoEmergencia === 'REFERIDO' || data.estadoEmergencia === 'ATENDIDO') {
            data.fechaAlta = new Date();
        }

        const updated = await (prisma as any).emergencia.update({
            where: { emergenciaId: BigInt(id) },
            data,
            include: {
                paciente: true
            }
        });

        // ── AUTOMATIC BILLING ON DISCHARGE ───────────────────────────
        // When status is 'ALTA', consolidate pending charges into a draft invoice.
        // Factura links directly to emergenciaId + pacienteId (no cita dependency).
        // CRITICAL: Never execute this if we're ONLY updating CartaAval!
        if (data.estadoEmergencia === 'ALTA' && !isOnlyUpdatingCartaAval) {
            try {
                // Fix Bug #3: use consistent userId extraction pattern
                const emisorId = BigInt(
                    (payload as any).userId ||
                    (payload as any).sub  ||
                    (payload as any).id   ||
                    1
                );

                await (prisma as any).$transaction(async (tx: any) => {
                    // 1. Get all pending charges for this emergency
                    const pendingCargos = await tx.cargoCuentaPaciente.findMany({
                        where: {
                            emergenciaId: BigInt(id),
                            estadoCobro:  'PENDIENTE',
                        },
                        include: {
                            insumo: {
                                select: { nombre: true, precioVenta: true },
                            },
                            examenLab: {
                                select: { nombre: true, precio: true },
                            },
                            examenImg: {
                                select: { nombre: true, precio: true },
                            }
                        },
                    });

                    // 2. Calculate totals and prepare line items
                    let totalAmount = 0;
                    const facturaDetalles = pendingCargos.map((cargo: any) => {
                        let itemName = "Cargo sin nombre";
                        let unitPrice = 0;

                        if (cargo.tipoCargo === 'INSUMO' && cargo.insumo) {
                            itemName = cargo.insumo.nombre;
                            unitPrice = Number(cargo.insumo.precioVenta || 0);
                        } else if (cargo.tipoCargo === 'EXAMEN' && cargo.examenLab) {
                            itemName = cargo.examenLab.nombre;
                            unitPrice = Number(cargo.examenLab.precio || 0);
                        } else if (cargo.tipoCargo === 'EXAMEN' && cargo.examenImg) {
                            itemName = cargo.examenImg.nombre;
                            unitPrice = Number(cargo.examenImg.precio || 0);
                        }

                        const qty    = Number(cargo.cantidad);
                        const amount = unitPrice * qty;
                        totalAmount += amount;
                        return {
                            tipoItem:       cargo.tipoCargo,
                            descripcion:    itemName,
                            cantidad:       cargo.cantidad,
                            precioUnitario: unitPrice,
                            importe:        amount,
                            referenciaId:   cargo.referenciaId || cargo.examenLabId || cargo.examenImgId || null,
                        };
                    });

                    // 3. Always add a base "Consulta de Emergencia" service line
                    //    so caja always has something to edit, even if there were no charges.
                    const hasConsultaLine = facturaDetalles.length === 0;
                    if (hasConsultaLine) {
                        facturaDetalles.push({
                            tipoItem:       'SERVICIO',
                            descripcion:    'Consulta de Emergencia — pendiente de ajuste en caja',
                            cantidad:       1,
                            precioUnitario: 0,
                            importe:        0,
                            referenciaId:   null,
                        });
                    }

                    // 4. Generate robust invoice number: FCT-EMG-YYYYMM-NNNN
                    const now = new Date();
                    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
                    const existingCount = await tx.factura.count({
                        where: { numeroFactura: { startsWith: `FCT-EMG-${yearMonth}` } }
                    });
                    const newInvoiceNumber = `FCT-EMG-${yearMonth}-${String(existingCount + 1).padStart(4, '0')}`;

                    // 5. Create or Update existing PENDIENTE factura for this emergency
                    const existingFactura = await tx.factura.findUnique({
                        where: { emergenciaId: BigInt(id) },
                        include: { detalles: true }
                    });

                    if (!existingFactura) {
                        await tx.factura.create({
                            data: {
                                pacienteId:     updated.pacienteId,
                                emergenciaId:   BigInt(id),
                                citaId:         updated.citaId || null,
                                numeroFactura:  newInvoiceNumber,
                                usuarioEmision: emisorId,
                                estadoFactura:  'EN_REVISION',
                                subtotal:       totalAmount,
                                total:          totalAmount,
                                saldoPendiente: totalAmount,
                                observaciones:  pendingCargos.length === 0
                                    ? 'Emergencia dada de alta sin cargos previos. Ajustar en caja.'
                                    : 'Consolidación automática al Alta Médica.',
                                detalles: { create: facturaDetalles },
                            },
                        });
                    } else if (existingFactura.estadoFactura === 'EN_REVISION' || existingFactura.estadoFactura === 'PENDIENTE') {
                        // ⚠️ CRITICAL: NEVER modify a factura that is already APROBADA or beyond
                        // If somehow we reach here with an approved factura, skip this update
                        const invoiceNumber = existingFactura.numeroFactura || newInvoiceNumber;

                        // First delete old details to avoid duplicates
                        await tx.facturaDetalle.deleteMany({
                            where: { facturaId: existingFactura.facturaId }
                        });

                        await tx.factura.update({
                            where: { facturaId: existingFactura.facturaId },
                            data: {
                                numeroFactura:  invoiceNumber,
                                subtotal:       totalAmount,
                                total:          totalAmount,
                                saldoPendiente: totalAmount,
                                detalles: { create: facturaDetalles },
                                observaciones: `Actualizada en Alta Médica. Cargos consolidados: ${pendingCargos.length}`
                            }
                        });
                    } else {
                        // Factura exists but is in APROBADA or later state — NEVER touch it
                        console.warn(`[Emergency] Factura #${existingFactura.numeroFactura} (ID: ${existingFactura.facturaId}) is in state ${existingFactura.estadoFactura}. Skipping consolidation to prevent data loss.`);
                    }

                    // 5. Mark charges as FACTURADO
                    if (pendingCargos.length > 0) {
                        await tx.cargoCuentaPaciente.updateMany({
                            where: {
                                cargoId: { in: pendingCargos.map((c: any) => c.cargoId) },
                            },
                            data: { estadoCobro: 'FACTURADO' },
                        });
                    }
                });
            } catch (billingError) {
                // Log with full detail — this is now visible in server logs.
                // We wrap it but still return success for the status change itself.
                console.error("[Emergency] Billing consolidation failed:", billingError);
            }
        }


        // If a medico was assigned/unassigned, sync it with the linked CitaMedica
        if (data.medicoId !== undefined && updated.citaId) {
            try {
                if (data.medicoId !== null) {
                    await (prisma as any).citaMedica.update({
                        where: { citaId: updated.citaId },
                        data: { medicoId: data.medicoId }
                    });
                }
            } catch (e) {
                console.error("Failed to sync medicoId with CitaMedica:", e);
            }
        }

        // Upsert Carta Aval
        // CRITICAL: Updating CartaAval should NOT affect the factura or its billing state
        // Only when CREATING (not updating) and setting to APROBADA should we update emergency payment verification
        if (cartaAvalData) {
            if (cartaAvalData.cartaAvalId) {
                // ⚠️ IMPORTANT: When updating CartaAval, DO NOT change emergency payment verification
                // Even if rejecting CartaAval, the factura and its charges should remain intact
                await (prisma as any).cartaAval.update({
                    where: { cartaAvalId: BigInt(cartaAvalData.cartaAvalId) },
                    data: {
                        codigoAval: cartaAvalData.codigoAval,
                        estado: cartaAvalData.estado,
                        observaciones: cartaAvalData.observaciones,
                        ...(cartaAvalData.estado === "APROBADA" || cartaAvalData.estado === "RECHAZADA" ? { fechaRespuesta: new Date() } : {})
                    }
                    // NOTE: We explicitly do NOT update emergencia.verificacionPago or tipoPago here
                    // because updating CartaAval from APROBADA to RECHAZADA should not affect billing
                });
            } else {
                // Only when CREATING a new CartaAval and setting it to APROBADA should we update payment verification
                const shouldUpdatePaymentVerification = cartaAvalData.estado === "APROBADA";

                await (prisma as any).cartaAval.create({
                    data: {
                        emergenciaId: BigInt(id),
                        polizaId: BigInt(cartaAvalData.polizaId),
                        codigoAval: cartaAvalData.codigoAval,
                        estado: cartaAvalData.estado,
                        observaciones: cartaAvalData.observaciones,
                        fechaSolicitud: new Date(),
                        ...(cartaAvalData.estado === "APROBADA" || cartaAvalData.estado === "RECHAZADA" ? { fechaRespuesta: new Date() } : {})
                    }
                });

                // Only update emergency verification if we created a new APROBADA CartaAval
                if (shouldUpdatePaymentVerification) {
                    await (prisma as any).emergencia.update({
                        where: { emergenciaId: BigInt(id) },
                        data: {
                            verificacionPago: 'CONFIRMADO',
                            tipoPago: 'ASEGURADO'
                        }
                    });
                }
            }
        }

        if (data.estadoEmergencia) {
            const estadosGraves = ['CIRUGIA_URGENTE', 'ALTA', 'REFERIDO'];
            logAuditoria({
                usuarioId: (payload as any).userId ?? (payload as any).sub,
                nombreUsuario: (payload as any).email,
                rolUsuario: (payload as any).role,
                modulo: 'EMERGENCIAS',
                accion: 'EMERGENCIA_ESTADO_CAMBIADO',
                descripcion: `Emergencia #${id} cambió estado a ${data.estadoEmergencia}`,
                severidad: estadosGraves.includes(data.estadoEmergencia) ? 'WARNING' : 'INFO',
                entidadTipo: 'Emergencia',
                entidadId: id,
                metadatos: { nuevoEstado: data.estadoEmergencia, nivelUrgencia: data.nivelUrgencia },
                req,
            });
        }

        return NextResponse.json({
            success: true,
            emergenciaId: updated.emergenciaId.toString()
        });

    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "Emergencia no encontrada" }, { status: 404 });
        console.error("Error updating emergency:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
