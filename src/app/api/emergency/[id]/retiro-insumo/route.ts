import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* ─────────────────────────────────────────────────────────
   GET  /api/emergency/[id]/retiro-insumo
   Returns all SALIDA movements linked to this emergency
───────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const emergenciaId = resolvedParams.id;

        const movimientos = await (prisma as any).movimientoInventario.findMany({
            where: {
                tipoMovimiento: "SALIDA",
                cargosCuenta: { some: { emergenciaId: BigInt(emergenciaId) } }
            },
            include: {
                almacen: { select: { nombre: true } },
                detalles: {
                    include: {
                        insumo: { select: { nombre: true, unidadMedida: true, codigo: true } },
                        lote:   { select: { codigo: true, fechaVencimiento: true } },
                    },
                },
                usuario: { select: { email: true, empleado: { select: { nombres: true, apellidos: true } } } },
            },
            orderBy: { fechaMovimiento: "desc" },
        });

        return NextResponse.json(
            movimientos.map((m: any) => ({
                movimientoId:    m.movimientoId.toString(),
                almacen:         m.almacen.nombre,
                referencia:      m.referencia,
                fechaMovimiento: m.fechaMovimiento,
                enfermera:       m.usuario?.empleado
                    ? `${m.usuario.empleado.nombres} ${m.usuario.empleado.apellidos}`
                    : m.usuario?.email || "—",
                observaciones: m.observaciones,
                detalles: m.detalles.map((d: any) => ({
                    insumoId: d.insumoId.toString(),
                    insumo:   d.insumo.nombre,
                    codigo:   d.insumo.codigo,
                    unidad:   d.insumo.unidadMedida,
                    cantidad: parseFloat(d.cantidad.toString()),
                    lote:     d.lote?.codigo ?? null,
                    loteVence: d.lote?.fechaVencimiento ?? null,
                })),
            }))
        );
    } catch (error) {
        console.error("Error fetching retiros:", error);
        return NextResponse.json({ error: "Error al cargar retiros" }, { status: 500 });
    }
}

/* ─────────────────────────────────────────────────────────
   POST /api/emergency/[id]/retiro-insumo
   Body: { almacenId, insumoId, cantidad, observaciones? }
   Applies FEFO, creates MovimientoInventario SALIDA (with
   lote_id), decrements Stock + StockLote(s) por FEFO multi-lote, and records
   CargoCuentaPaciente linked to insumo via FK.
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);
        const { almacenId, insumoId, cantidad, observaciones } = await req.json();

        if (!almacenId || !insumoId || !cantidad || cantidad <= 0) {
            return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
        }

        const almacenIdBig = BigInt(almacenId);
        const insumoIdBig  = BigInt(insumoId);
        const cantidadNum  = parseFloat(cantidad);

        // Verify aggregate stock availability
        const stock = await (prisma as any).stock.findUnique({
            where: { uq_stock: { almacenId: almacenIdBig, insumoId: insumoIdBig } },
        });

        if (!stock || parseFloat(stock.cantidadActual.toString()) < cantidadNum) {
            return NextResponse.json({ error: "Stock insuficiente" }, { status: 409 });
        }

        // Fix Bug #5: Fetch the emergencia to get the linked citaId for CargoCuentaPaciente
        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId: BigInt(resolvedParams.id) },
            select: { citaId: true },
        });
        const citaIdForCargo: bigint | null = emergencia?.citaId ? BigInt(emergencia.citaId.toString()) : null;

        await (prisma as any).$transaction(async (tx: any) => {
            // ── FEFO multi-lote: consume de varios lotes si hace falta ────
            const stockLotesFefo = await tx.stockLote.findMany({
                where: {
                    almacenId: almacenIdBig,
                    cantidadActual: { gt: 0 },
                    lote: { insumoId: insumoIdBig, activo: true },
                },
                include: { lote: { select: { loteId: true } } },
                orderBy: { lote: { fechaVencimiento: "asc" } },
            });

            const movimientoDetalles: { loteId: bigint | null; cantidad: number }[] = [];
            let remaining = cantidadNum;

            for (const sl of stockLotesFefo) {
                if (remaining <= 0) break;
                const available = parseFloat(sl.cantidadActual.toString());
                const toTake = Math.min(available, remaining);
                await tx.stockLote.update({
                    where: { stockLoteId: sl.stockLoteId },
                    data:  { cantidadActual: available - toTake },
                });
                movimientoDetalles.push({
                    loteId:   sl.lote?.loteId ? BigInt(sl.lote.loteId.toString()) : null,
                    cantidad: toTake,
                });
                remaining -= toTake;
            }

            // Fallback: el stock agregado se valida arriba pero los lotes pueden no
            // cubrir todo (stock sin lote asignado o desfase lote/agregado). Registramos
            // el remanente sin lote; el decremento agregado abajo cubre el book-value.
            if (remaining > 0) {
                movimientoDetalles.push({ loteId: null, cantidad: remaining });
            }

            // ── Referencia secuencial ─────────────────────────────────────
            const countSalidas = await tx.movimientoInventario.count({
                where: { tipoMovimiento: "SALIDA", almacenId: almacenIdBig },
            });
            const numSalida      = countSalidas + 1;
            const referencia     = `SAL-ENF-${numSalida}`;
            const observacionAuto = observaciones?.trim()
                ? observaciones.trim()
                : `Retiro de insumo por enfermeria #${numSalida}`;

            // ── Movimiento de inventario ──────────────────────────────────
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    almacenId:      almacenIdBig,
                    tipoMovimiento: "SALIDA",
                    usuarioId,
                    referencia,
                    observaciones:  observacionAuto,
                },
            });

            // ── Detalles del movimiento (uno por lote consumido) ─────────
            for (const det of movimientoDetalles) {
                await tx.movimientoDetalle.create({
                    data: {
                        movimientoId: movimiento.movimientoId,
                        insumoId:     insumoIdBig,
                        loteId:       det.loteId,
                        cantidad:     det.cantidad,
                    },
                });
            }

            // ── Decremento del stock agregado (una sola vez) ──────────────
            await tx.stock.update({
                where: { uq_stock: { almacenId: almacenIdBig, insumoId: insumoIdBig } },
                data:  { cantidadActual: { decrement: cantidadNum } },
            });

            // ── Cargo al paciente: techo para facturación correcta ────────
            await tx.cargoCuentaPaciente.create({
                data: {
                    emergenciaId:     BigInt(resolvedParams.id),
                    citaId:           citaIdForCargo,
                    tipoCargo:        "INSUMO",
                    referenciaId:     insumoIdBig,
                    cantidad:         Math.ceil(cantidadNum),
                    movimientoId:     movimiento.movimientoId,
                    usuarioGenerador: usuarioId,
                    observaciones:    observacionAuto,
                    estadoCobro:      "PENDIENTE",
                },
            });
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Error registering retiro:", error);
        return NextResponse.json({ error: "Error al registrar retiro" }, { status: 500 });
    }
}

