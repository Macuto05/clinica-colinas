import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await params;

        const factura = await (prisma as any).factura.findUnique({
            where: { facturaId: BigInt(id) }
        });

        if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });

        if (factura.estadoFactura !== 'EN_REVISION') {
            return NextResponse.json({ error: "Solo se pueden aprobar facturas en revisión" }, { status: 409 });
        }

        const updated = await (prisma as any).factura.update({
            where: { facturaId: BigInt(id) },
            data: { estadoFactura: 'PENDIENTE' }
        });

        return NextResponse.json({ success: true, estadoFactura: updated.estadoFactura });
    } catch (error) {
        console.error("Error aprobando factura:", error);
        return NextResponse.json({ error: "Error interno al aprobar la factura" }, { status: 500 });
    }
}
