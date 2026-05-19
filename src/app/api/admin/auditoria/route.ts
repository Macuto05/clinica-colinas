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
        if (!payload || (payload as any).role !== 'ADMIN') {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const modulo      = searchParams.get("modulo");
        const accion      = searchParams.get("accion");
        const severidad   = searchParams.get("severidad");
        const usuarioId   = searchParams.get("usuarioId");
        const desde       = searchParams.get("desde");
        const hasta       = searchParams.get("hasta");
        const busqueda    = searchParams.get("q");
        const page        = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize    = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") || "10")));

        const where: any = {};

        if (modulo)    where.modulo    = modulo;
        if (accion)    where.accion    = accion;
        if (severidad) where.severidad = severidad;
        if (usuarioId) where.usuarioId = BigInt(usuarioId);

        if (desde || hasta) {
            where.fechaHora = {};
            if (desde) where.fechaHora.gte = new Date(desde);
            if (hasta) {
                const hastaDate = new Date(hasta);
                hastaDate.setHours(23, 59, 59, 999);
                where.fechaHora.lte = hastaDate;
            }
        }

        if (busqueda) {
            where.OR = [
                { descripcion:   { contains: busqueda, mode: 'insensitive' } },
                { nombreUsuario: { contains: busqueda, mode: 'insensitive' } },
                { accion:        { contains: busqueda, mode: 'insensitive' } },
            ];
        }

        const [total, registros] = await Promise.all([
            prisma.registroAuditoria.count({ where }),
            prisma.registroAuditoria.findMany({
                where,
                orderBy: { fechaHora: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id:           true,
                    fechaHora:    true,
                    nombreUsuario: true,
                    rolUsuario:   true,
                    modulo:       true,
                    accion:       true,
                    descripcion:  true,
                    severidad:    true,
                    entidadTipo:  true,
                    entidadId:    true,
                    metadatos:    true,
                    ipOrigen:     true,
                },
            }),
        ]);

        return NextResponse.json({
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            registros,
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json({ error: "Error al cargar registros de auditoría" }, { status: 500 });
    }
}
