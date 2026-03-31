import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const planCoberturaSchema = z.object({
    nombre: z.string().min(1),
    montoMaximo: z.number().min(0),
});

const updateInsurerSchema = z.object({
    nombre: z.string().min(2).optional(),
    rifNif: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    correo: z.string().email("Correo inválido").optional().nullable(),
    direccion: z.string().optional().nullable(),
    activa: z.boolean().optional(),
    planesCobertura: z.array(planCoberturaSchema).optional(),
});

// GET — Get insurer by ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const aseguradora = await prisma.aseguradora.findUnique({
            where: { aseguradoraId: BigInt(id) },
            include: {
                polizas: {
                    include: {
                        paciente: {
                            select: { nombres: true, apellidos: true, documentoIdentidad: true }
                        }
                    }
                }
            }
        });

        if (!aseguradora) {
            return NextResponse.json({ error: "Aseguradora no encontrada" }, { status: 404 });
        }

        return NextResponse.json({
            ...aseguradora,
            aseguradoraId: aseguradora.aseguradoraId.toString(),
            planesCobertura: (aseguradora as any).planesCobertura ?? [],
            polizas: aseguradora.polizas.map(p => ({
                ...p,
                polizaId: p.polizaId.toString(),
                pacienteId: p.pacienteId.toString(),
                aseguradoraId: p.aseguradoraId.toString()
            }))
        });
    } catch (error) {
        console.error("Error fetching insurer:", error);
        return NextResponse.json({ error: "Error al cargar aseguradora" }, { status: 500 });
    }
}

// PUT — Update insurer
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await req.json();
        const result = updateInsurerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.format() },
                { status: 400 }
            );
        }

        const updated = await prisma.aseguradora.update({
            where: { aseguradoraId: BigInt(id) },
            data: result.data
        });

        return NextResponse.json({
            success: true,
            aseguradora: { ...updated, aseguradoraId: updated.aseguradoraId.toString() }
        });

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Aseguradora no encontrada" }, { status: 404 });
        }
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe una aseguradora con ese nombre o RIF" }, { status: 409 });
        }
        console.error("Error updating insurer:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE — Soft delete (toggle activa)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;

        const current = await prisma.aseguradora.findUnique({
            where: { aseguradoraId: BigInt(id) }
        });

        if (!current) {
            return NextResponse.json({ error: "Aseguradora no encontrada" }, { status: 404 });
        }

        const updated = await prisma.aseguradora.update({
            where: { aseguradoraId: BigInt(id) },
            data: { activa: !current.activa }
        });

        return NextResponse.json({
            success: true,
            activa: updated.activa
        });

    } catch (error) {
        console.error("Error toggling insurer:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
