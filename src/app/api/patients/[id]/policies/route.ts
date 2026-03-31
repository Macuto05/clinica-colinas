import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const createPolicySchema = z.object({
    aseguradoraId: z.string().min(1, "Aseguradora es requerida"),
    numeroPoliza: z.string().min(1, "Número de póliza es requerido"),
    tipoCobertura: z.string().optional().nullable(),
    montoCobertura: z.number().optional().nullable(),
    fechaInicio: z.string().optional().nullable(),
    fechaVence: z.string().optional().nullable(),
    observaciones: z.string().optional().nullable(),
});

// GET — List policies for a patient
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const pacienteId = BigInt(id);

        const polizas = await prisma.poliza.findMany({
            where: { pacienteId },
            include: {
                aseguradora: {
                    select: { nombre: true, rifNif: true, telefono: true, activa: true }
                },
                _count: { select: { cartasAval: true } }
            },
            orderBy: { polizaId: 'desc' }
        });

        const formatted = polizas.map(p => ({
            polizaId: p.polizaId.toString(),
            pacienteId: p.pacienteId.toString(),
            aseguradoraId: p.aseguradoraId.toString(),
            aseguradora: p.aseguradora.nombre,
            aseguradoraRif: p.aseguradora.rifNif,
            aseguradoraTelefono: p.aseguradora.telefono,
            aseguradoraActiva: p.aseguradora.activa,
            numeroPoliza: p.numeroPoliza,
            tipoCobertura: p.tipoCobertura,
            montoCobertura: (p as any).montoCobertura ? Number((p as any).montoCobertura) : null,
            fechaInicio: p.fechaInicio,
            fechaVence: p.fechaVence,
            estado: p.estado,
            observaciones: p.observaciones,
            totalCartasAval: p._count.cartasAval
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching policies:", error);
        return NextResponse.json({ error: "Error al cargar pólizas" }, { status: 500 });
    }
}

// POST — Create a policy for a patient
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await context.params;
        const pacienteId = BigInt(id);

        // Verify patient exists
        const paciente = await prisma.paciente.findUnique({ where: { pacienteId } });
        if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

        const body = await req.json();
        const result = createPolicySchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const { aseguradoraId, numeroPoliza, tipoCobertura, montoCobertura, fechaInicio, fechaVence, observaciones } = result.data;

        const poliza = await prisma.poliza.create({
            data: {
                pacienteId,
                aseguradoraId: BigInt(aseguradoraId),
                numeroPoliza,
                tipoCobertura: tipoCobertura || null,
                montoCobertura: montoCobertura ?? null,
                fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
                fechaVence: fechaVence ? new Date(fechaVence) : null,
                observaciones: observaciones || null,
                estado: 'ACTIVA'
            } as any
        });

        return NextResponse.json({
            success: true,
            poliza: { ...poliza, polizaId: poliza.polizaId.toString(), pacienteId: poliza.pacienteId.toString(), aseguradoraId: poliza.aseguradoraId.toString() }
        }, { status: 201 });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Esta póliza ya existe para este paciente" }, { status: 409 });
        }
        console.error("Error creating policy:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
