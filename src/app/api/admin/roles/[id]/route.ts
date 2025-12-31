import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";

const updateRoleSchema = z.object({
    nombre: z.string().min(3).max(50).optional(),
    descripcion: z.string().optional().or(z.literal("")),
    activo: z.boolean().optional(),
});

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = BigInt(params.id);
        const body = await request.json();
        const result = updateRoleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Check if updating sensitive roles? Optional.

        await prisma.rol.update({
            where: { rolId: id },
            data: result.data
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error updating role:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = BigInt(params.id);

        // Check for users
        const role = await prisma.rol.findUnique({
            where: { rolId: id },
            include: { _count: { select: { usuarios: true } } }
        });

        if (!role) return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });

        if (role._count.usuarios > 0) {
            return NextResponse.json({ error: `No se puede eliminar el rol porque tiene ${role._count.usuarios} usuarios asignados.` }, { status: 400 });
        }

        // Prevent deleting critical roles like ADMIN, MEDICO, PACIENTE
        const criticalRoles = ['ADMIN', 'MEDICO', 'PACIENTE'];
        if (criticalRoles.includes(role.nombre)) {
            return NextResponse.json({ error: "No se puede eliminar este rol del sistema." }, { status: 403 });
        }

        await prisma.rol.delete({
            where: { rolId: id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
