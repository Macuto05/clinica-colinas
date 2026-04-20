import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

const updatePolicySchema = z.object({
    aseguradoraId: z.string().optional(),
    numeroPoliza: z.string().optional(),
    tipoCobertura: z.string().optional().nullable(),
    fechaInicio: z.string().optional().nullable(),
    fechaVence: z.string().optional().nullable(),
    estado: z.enum(["ACTIVA", "VENCIDA", "SUSPENDIDA"]).optional(),
    observaciones: z.string().optional().nullable(),
});

// PUT — Update a policy
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string; polizaId: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { polizaId } = await context.params;

        const body = await req.json();
        const result = updatePolicySchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const data: any = { ...result.data };
        if (data.aseguradoraId) data.aseguradoraId = BigInt(data.aseguradoraId);
        if (data.fechaInicio) data.fechaInicio = new Date(data.fechaInicio);
        if (data.fechaVence) data.fechaVence = new Date(data.fechaVence);

        const updated = await prisma.poliza.update({
            where: { polizaId: BigInt(polizaId) },
            data
        });

        return NextResponse.json({
            success: true,
            poliza: { ...updated, polizaId: updated.polizaId.toString(), pacienteId: updated.pacienteId.toString(), aseguradoraId: updated.aseguradoraId.toString() }
        });

    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "Póliza no encontrada" }, { status: 404 });
        console.error("Error updating policy:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE — Remove a policy
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string; polizaId: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { polizaId } = await context.params;

        // Check for active cartas aval
        const poliza = await prisma.poliza.findUnique({
            where: { polizaId: BigInt(polizaId) },
            include: { _count: { select: { cartasAval: true } } }
        });

        if (!poliza) return NextResponse.json({ error: "Póliza no encontrada" }, { status: 404 });

        if (poliza._count.cartasAval > 0) {
            // Soft delete: change status to SUSPENDIDA instead of hard delete
            await prisma.poliza.update({
                where: { polizaId: BigInt(polizaId) },
                data: { estado: 'SUSPENDIDA' }
            });
            return NextResponse.json({ success: true, softDeleted: true, message: "Póliza suspendida (tiene cartas aval asociadas)" });
        }

        await prisma.poliza.delete({ where: { polizaId: BigInt(polizaId) } });
        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "Póliza no encontrada" }, { status: 404 });
        console.error("Error deleting policy:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
