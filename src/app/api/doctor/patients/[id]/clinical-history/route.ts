import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLINICAL_HISTORY_SECTIONS } from "@/lib/clinical-history-config";

const bigIntReplacer = (_key: string, value: any) => {
    if (typeof value === 'bigint') return value.toString();
    return value;
};

// IDs de campos del examen físico (secciones p2_*)
const PHYSICAL_EXAM_FIELD_IDS = new Set(
    CLINICAL_HISTORY_SECTIONS
        .filter(s => s.id.startsWith("p2_"))
        .flatMap(s => s.fields.map(f => f.id))
);

function stripDate(value: string): string {
    return value.replace(/\s*\d{2}\/\d{2}\/\d{4}$/, "").trimEnd();
}

function todayFormatted(): string {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${d.getFullYear()}`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const pacienteId = parseInt(id);
        if (isNaN(pacienteId)) {
            return NextResponse.json({ error: "ID de paciente inválido" }, { status: 400 });
        }

        const historia = await prisma.historiaClinica.findUnique({
            where: { pacienteId: pacienteId }
        });

        if (!historia) {
            return NextResponse.json({ contenido: {} });
        }

        const json = JSON.stringify(historia, bigIntReplacer);
        return new NextResponse(json, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error fetching clinical history:", error);
        return NextResponse.json({ error: "Error al obtener historia clínica" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const pacienteId = parseInt(id);
        const body = await req.json();

        if (isNaN(pacienteId)) {
            return NextResponse.json({ error: "ID de paciente inválido" }, { status: 400 });
        }

        const { contenido, updatedById } = body;
        const dateStr = todayFormatted();

        // Leer registro existente para comparar valores campo a campo
        const existing = await prisma.historiaClinica.findUnique({
            where: { pacienteId },
            select: { contenido: true }
        });
        const oldContenido = (existing?.contenido ?? {}) as Record<string, any>;

        // Procesar campos del examen físico: estampar fecha solo si el contenido cambió
        const processedContenido: Record<string, any> = {};
        for (const [key, newValue] of Object.entries(contenido as Record<string, any>)) {
            if (PHYSICAL_EXAM_FIELD_IDS.has(key) && typeof newValue === "string") {
                const oldRaw = typeof oldContenido[key] === "string" ? oldContenido[key] : "";
                const oldStripped = stripDate(oldRaw);
                const newStripped = stripDate(newValue);

                if (newStripped === oldStripped) {
                    // Sin cambio → conservar valor original con su fecha
                    processedContenido[key] = oldRaw;
                } else if (newStripped === "") {
                    // Campo vaciado → guardar vacío, sin fecha
                    processedContenido[key] = "";
                } else {
                    // Contenido nuevo o modificado → estampar fecha de hoy
                    processedContenido[key] = `${newStripped} ${dateStr}`;
                }
            } else {
                processedContenido[key] = newValue;
            }
        }

        const historia = await prisma.historiaClinica.upsert({
            where: { pacienteId },
            update: {
                contenido: processedContenido,
                updatedById: updatedById ? parseInt(updatedById) : null
            },
            create: {
                pacienteId,
                contenido: processedContenido,
                updatedById: updatedById ? parseInt(updatedById) : null
            }
        });

        const json = JSON.stringify(historia, bigIntReplacer);
        return new NextResponse(json, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error updating clinical history:", error);
        return NextResponse.json({ error: "Error al guardar historia clínica" }, { status: 500 });
    }
}
