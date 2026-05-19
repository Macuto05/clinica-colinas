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
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const ahora   = new Date();
        const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const finDia    = new Date(inicioDia.getTime() + 86400000 - 1);

        const [
            comprasPendientes,
            proveedoresActivos,
            facturasHoy,
            pagosPendientes,
            ingresosHoy,
        ] = await Promise.all([
            // Pedidos de compra en estado PENDIENTE
            prisma.pedidoCompra.count({
                where: { estado: 'PENDIENTE' },
            }),

            // Proveedores activos
            prisma.proveedor.count({
                where: { activo: true },
            }),

            // Facturas creadas hoy (todas)
            prisma.factura.count({
                where: { fechaEmision: { gte: inicioDia, lte: finDia } },
            }),

            // Pagos pendientes de validación
            prisma.pago.count({
                where: { estadoPago: 'PENDIENTE' },
            }),

            // Ingresos validados hoy
            prisma.pago.aggregate({
                where: {
                    estadoPago: 'VALIDADO',
                    fechaRegistro: { gte: inicioDia, lte: finDia },
                },
                _sum: { monto: true },
            }),
        ]);

        return NextResponse.json({
            comprasPendientes,
            proveedoresActivos,
            facturasHoy,
            pagosPendientes,
            ingresosHoy: Number(ingresosHoy._sum.monto ?? 0),
        });
    } catch (error) {
        console.error("Error caja dashboard:", error);
        return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 });
    }
}
