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

        const doctors = await prisma.medico.findMany({
            where: { activo: true },
            include: {
                empleado: {
                    select: {
                        empleadoId: true,
                        nombres: true,
                        apellidos: true,
                    }
                },
                especialidad: {
                    select: {
                        nombre: true,
                    }
                }
            },
            orderBy: { empleado: { nombres: 'asc' } },
        });

        return NextResponse.json({
            doctors: doctors.map(d => ({
                empleadoId: d.empleadoId.toString(),
                empleado: d.empleado,
                especialidad: d.especialidad,
            })),
        });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        return NextResponse.json({ error: "Error al cargar médicos" }, { status: 500 });
    }
}
