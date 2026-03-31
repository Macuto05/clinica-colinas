import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const planCoberturaSchema = z.object({
    nombre: z.string().min(1, "El nombre del plan es requerido"),
    montoMaximo: z.number().min(0, "El monto debe ser positivo"),
});

const insurerSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    rifNif: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    correo: z.string().email("Correo inválido").optional().nullable(),
    direccion: z.string().optional().nullable(),
    activa: z.boolean().optional().default(true),
    planesCobertura: z.array(planCoberturaSchema).optional().default([]),
});

// GET — List all insurers
export async function GET() {
    try {
        const aseguradoras = await prisma.aseguradora.findMany({
            orderBy: { nombre: 'asc' },
            include: {
                _count: { select: { polizas: true } }
            }
        });

        const formatted = aseguradoras.map(a => ({
            aseguradoraId: a.aseguradoraId.toString(),
            nombre: a.nombre,
            rifNif: a.rifNif,
            telefono: a.telefono,
            correo: a.correo,
            direccion: a.direccion,
            activa: a.activa,
            planesCobertura: (a as any).planesCobertura ?? [],
            totalPolizas: a._count.polizas
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching insurers:", error);
        return NextResponse.json({ error: "Error al cargar aseguradoras" }, { status: 500 });
    }
}

// POST — Create new insurer
export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const body = await req.json();
        const result = insurerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.format() },
                { status: 400 }
            );
        }

        const { nombre, rifNif, telefono, correo, direccion, activa, planesCobertura } = result.data;

        const newInsurer = await prisma.aseguradora.create({
            data: { nombre, rifNif, telefono, correo, direccion, activa, planesCobertura: planesCobertura ?? [] } as any
        });

        return NextResponse.json({
            success: true,
            aseguradora: {
                ...newInsurer,
                aseguradoraId: newInsurer.aseguradoraId.toString()
            }
        }, { status: 201 });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe una aseguradora con ese nombre o RIF" }, { status: 409 });
        }
        console.error("Error creating insurer:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
