import { prisma } from "@/infrastructure/database/prisma/client";
import { ServiciosTable } from "./ServiciosTable";

export interface Servicio {
    examenId: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    activo: boolean;
    tipo: "laboratorio" | "imagenologia";
}

export default async function ServiciosPage() {
    const [labRaw, imgRaw] = await Promise.all([
        (prisma as any).examenLaboratorio.findMany({
            select: { examenId: true, nombre: true, descripcion: true, precio: true, activo: true },
            orderBy: { nombre: "asc" },
        }),
        (prisma as any).examenImagenologia.findMany({
            select: { examenId: true, nombre: true, descripcion: true, precio: true, activo: true },
            orderBy: { nombre: "asc" },
        }),
    ]);

    const servicios: Servicio[] = [
        ...labRaw.map((e: any) => ({
            examenId:    e.examenId.toString(),
            nombre:      e.nombre,
            descripcion: e.descripcion ?? null,
            precio:      Number(e.precio || 0),
            activo:      e.activo,
            tipo:        "laboratorio" as const,
        })),
        ...imgRaw.map((e: any) => ({
            examenId:    e.examenId.toString(),
            nombre:      e.nombre,
            descripcion: e.descripcion ?? null,
            precio:      Number(e.precio || 0),
            activo:      e.activo,
            tipo:        "imagenologia" as const,
        })),
    ].sort((a, b) => a.nombre.localeCompare(b.nombre));

    return <ServiciosTable servicios={servicios} />;
}
