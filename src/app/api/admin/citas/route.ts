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

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") || "10")));
        const search = searchParams.get("search");

        const where: any = {
            tipoCita: { not: 'EMERGENCIA' } // Exclude emergencies
        };

        if (search) {
            where.OR = [
                { paciente: { nombres: { contains: search, mode: 'insensitive' } } },
                { paciente: { apellidos: { contains: search, mode: 'insensitive' } } },
                { medico: { empleado: { nombres: { contains: search, mode: 'insensitive' } } } },
                { medico: { empleado: { apellidos: { contains: search, mode: 'insensitive' } } } },
            ];
        }

        const [total, citas] = await Promise.all([
            prisma.citaMedica.count({ where }),
            prisma.citaMedica.findMany({
                where,
                include: {
                    paciente: { select: { nombres: true, apellidos: true } },
                    medico: {
                        include: {
                            empleado: { select: { nombres: true, apellidos: true } }
                        }
                    }
                },
                orderBy: { fechaCita: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const formatted = citas.map(cita => ({
            id: cita.citaId,
            datetime: new Date(
                cita.fechaCita.getFullYear(),
                cita.fechaCita.getMonth(),
                cita.fechaCita.getDate(),
                cita.horaInicio.getHours(),
                cita.horaInicio.getMinutes()
            ).toISOString(),
            status: cita.estadoCita,
            type: cita.tipoCita,
            reason: cita.motivoConsulta,
            patientName: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
            doctorName: `${cita.medico.empleado.nombres} ${cita.medico.empleado.apellidos}`,
        }));

        return NextResponse.json({
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            appointments: formatted,
        });
    } catch (error) {
        console.error("Error fetching citas:", error);
        return NextResponse.json({ error: "Error al cargar citas" }, { status: 500 });
    }
}
