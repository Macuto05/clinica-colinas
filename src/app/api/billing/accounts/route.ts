
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET() {
    try {
        const accounts = await prisma.cuentaBancaria.findMany({
            orderBy: { cuentaId: 'asc' }
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

        const newAccount = await prisma.cuentaBancaria.create({
            data: { banco, numeroCuenta, titular, rifTitular, tipo, activa: true }
        });

        return NextResponse.json(newAccount);
    } catch (error: any) {
        console.error("Error creating bank account:", error);
        return NextResponse.json({ error: error.message || "Error creating account" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { cuentaId, banco, numeroCuenta, titular, rifTitular, tipo, activa } = body;

        if (!cuentaId) {
            return NextResponse.json({ error: "ID de cuenta requerido" }, { status: 400 });
        }

        const updatedAccount = await prisma.cuentaBancaria.update({
            where: { cuentaId },
            data: { banco, numeroCuenta, titular, rifTitular, tipo, activa }
        });

        return NextResponse.json(updatedAccount);
    } catch (error: any) {
        console.error("Error updating bank account:", error);
        return NextResponse.json({ error: error.message || "Error updating account" }, { status: 500 });
    }
}
