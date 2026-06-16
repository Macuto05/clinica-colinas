import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET() {
    try {
        const accounts = await prisma.cuentaBancaria.findMany({
            orderBy: { cuentaId: "asc" },
        });
        return NextResponse.json(accounts);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching accounts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { banco, numeroCuenta, titular, rifTitular, tipo } = body;

        if (!banco?.trim() || !numeroCuenta?.trim() || !titular?.trim() || !rifTitular?.trim() || !tipo?.trim()) {
            return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
        }

        const duplicate = await prisma.cuentaBancaria.findFirst({ where: { numeroCuenta } });
        if (duplicate) {
            return NextResponse.json({ error: `Ya existe una cuenta registrada con el número "${numeroCuenta}".` }, { status: 409 });
        }

        const newAccount = await prisma.cuentaBancaria.create({
            data: { banco, numeroCuenta, titular, rifTitular, tipo, activa: true },
        });

        return NextResponse.json(newAccount);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Este número de cuenta ya está registrado." }, { status: 409 });
        }
        console.error("Error creating bank account:", error);
        return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { cuentaId, banco, numeroCuenta, titular, rifTitular, tipo, activa } = body;

        if (!cuentaId) {
            return NextResponse.json({ error: "ID de cuenta requerido" }, { status: 400 });
        }

        if (!banco?.trim() || !numeroCuenta?.trim() || !titular?.trim() || !rifTitular?.trim() || !tipo?.trim()) {
            return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
        }

        const duplicate = await prisma.cuentaBancaria.findFirst({
            where: { numeroCuenta, cuentaId: { not: cuentaId } },
        });
        if (duplicate) {
            return NextResponse.json({ error: `Ya existe otra cuenta registrada con el número "${numeroCuenta}".` }, { status: 409 });
        }

        const updatedAccount = await prisma.cuentaBancaria.update({
            where: { cuentaId },
            data: { banco, numeroCuenta, titular, rifTitular, tipo, activa },
        });

        return NextResponse.json(updatedAccount);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Este número de cuenta ya está registrado." }, { status: 409 });
        }
        console.error("Error updating bank account:", error);
        return NextResponse.json({ error: "Error al actualizar cuenta" }, { status: 500 });
    }
}
