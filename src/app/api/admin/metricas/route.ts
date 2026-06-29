import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload || (payload as any).role !== 'ADMIN') {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const mesParam = searchParams.get("mes"); // formato: "2026-05"

        const ahora = new Date();
        let año = ahora.getFullYear();
        let mes = ahora.getMonth(); // 0-indexed

        if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
            const [y, m] = mesParam.split("-").map(Number);
            año = y;
            mes = m - 1;
        }

        const inicioMes = new Date(año, mes, 1);
        const finMes    = new Date(año, mes + 1, 0, 23, 59, 59, 999);


        const [
            totalPacientes,
            citasMes,
            emergenciasActivas,
            pagosMes,
            citasPorEstado,
            emergenciasPorNivel,
            movimientosPorTipo,
            topMedicos,
        ] = await Promise.all([

            // KPI 1 — Total pacientes
            prisma.paciente.count(),

            // KPI 2 — Citas del mes seleccionado (excluye emergencias)
            prisma.citaMedica.count({
                where: {
                    fechaCreacion: { gte: inicioMes, lte: finMes },
                    tipoCita: { not: 'EMERGENCIA' },
                },
            }),

            // KPI 3 — Emergencias del mes seleccionado
            prisma.emergencia.count({
                where: {
                    fechaIngreso: { gte: inicioMes, lte: finMes },
                },
            }),

            // KPI 4 — Ingresos validados en el mes seleccionado
            prisma.pago.aggregate({
                where: {
                    estadoPago: 'VALIDADO',
                    fechaRegistro: { gte: inicioMes, lte: finMes },
                },
                _sum: { monto: true },
            }),

            // Chart 1 — Citas por estado (mes seleccionado)
            prisma.citaMedica.groupBy({
                by: ['estadoCita'],
                where: { fechaCreacion: { gte: inicioMes, lte: finMes }, tipoCita: { not: 'EMERGENCIA' } },
                _count: { _all: true },
                orderBy: { _count: { estadoCita: 'desc' } },
            }),

            // Chart 2 — Emergencias por nivel (mes seleccionado)
            prisma.emergencia.groupBy({
                by: ['nivelUrgencia'],
                where: { fechaIngreso: { gte: inicioMes, lte: finMes } },
                _count: { _all: true },
                orderBy: { _count: { nivelUrgencia: 'desc' } },
            }),

            // Chart 3 — Movimientos de inventario del mes seleccionado por tipo
            prisma.movimientoInventario.groupBy({
                by: ['tipoMovimiento'],
                where: { fechaMovimiento: { gte: inicioMes, lte: finMes } },
                _count: { _all: true },
                orderBy: { _count: { tipoMovimiento: 'desc' } },
            }),

            // Chart 4 — Top 5 médicos con más citas del mes seleccionado
            prisma.citaMedica.groupBy({
                by: ['medicoId'],
                where: { fechaCreacion: { gte: inicioMes, lte: finMes }, tipoCita: { not: 'EMERGENCIA' } },
                _count: { _all: true },
                orderBy: { _count: { medicoId: 'desc' } },
                take: 5,
            }),
        ]);

        // Resolver nombres de médicos
        const medicoIds = topMedicos.map(m => m.medicoId);
        const medicos = await prisma.medico.findMany({
            where: { empleadoId: { in: medicoIds } },
            include: {
                empleado: { select: { nombres: true, apellidos: true } },
                especialidad: { select: { nombre: true } },
            },
        });
        const medicoMap = Object.fromEntries(
            medicos.map(m => [m.empleadoId.toString(), m])
        );

        const topMedicosFormatted = topMedicos.map(m => {
            const medico = medicoMap[m.medicoId.toString()];
            return {
                medicoId: m.medicoId.toString(),
                nombre: medico
                    ? `${medico.empleado.nombres} ${medico.empleado.apellidos}`
                    : `Médico #${m.medicoId}`,
                especialidad: medico?.especialidad?.nombre ?? '—',
                totalCitas: m._count._all,
            };
        });

        return NextResponse.json({
            kpis: {
                totalPacientes,
                citasMes,
                emergenciasActivas,
                ingresosMes: Number(pagosMes._sum.monto ?? 0),
            },
            citasPorEstado: citasPorEstado.map(c => ({
                estado: c.estadoCita,
                total: c._count._all,
            })),
            emergenciasPorNivel: emergenciasPorNivel.map(e => ({
                nivel: e.nivelUrgencia,
                total: e._count._all,
            })),
            movimientosPorTipo: movimientosPorTipo.map(m => ({
                tipo: m.tipoMovimiento,
                total: m._count._all,
            })),
            topMedicos: topMedicosFormatted,
        });
    } catch (error) {
        console.error("Error fetching metricas:", error);
        return NextResponse.json({ error: "Error al cargar métricas" }, { status: 500 });
    }
}
