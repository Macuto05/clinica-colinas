import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";

const roleApiSchema = z.object({
    nombre: z.string().min(3).max(50),
    descripcion: z.string().optional().or(z.literal("")),
});

export async function GET() {
    try {
        const roles = await prisma.rol.findMany({
            orderBy: { nombre: 'asc' },
            include: {
                _count: {
                    select: { usuarios: true }
                }
            }
        });

        // Serialize BigInt
        const serializedRoles = roles.map(r => ({
            ...r,
            rolId: r.rolId.toString(),
            _count: { usuarios: r._count.usuarios }
        }));

        return NextResponse.json(serializedRoles);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = roleApiSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = result.data;

        // Check if exists
        const existing = await prisma.rol.findUnique({ where: { nombre: data.nombre } });
        if (existing) {
            return NextResponse.json({ error: "Ya existe un rol con este nombre" }, { status: 409 });
        }

        const newRole = await prisma.rol.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                activo: true
            }
        });

        return NextResponse.json({
            success: true,
            role: { ...newRole, rolId: newRole.rolId.toString() }
        });

    } catch (error: any) {
        console.error("Error creating role:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
