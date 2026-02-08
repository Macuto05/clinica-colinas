
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get('name') || 'Marcus';

        // 1. Find Patient
        const patient = await prisma.paciente.findFirst({
            where: { nombres: { contains: name } }
        });

        if (!patient) return NextResponse.json({ error: "Patient not found" });

        const patientId = patient.pacienteId;

        // 2. Run Query 1: Payments
        const pagos = await prisma.pago.findMany({
            where: {
                factura: {
                    cita: { pacienteId: patientId }
                }
            },
            include: { factura: true }
        });

        // 3. Run Query 2: Legacy Invoices
        const legacyInvoices = await prisma.factura.findMany({
            where: {
                cita: { pacienteId: patientId },
                estadoFactura: 'PAGADA',
                pagos: { none: {} }
            }
        });

        // 4. Run Query 3: ALL Invoices (Base Check)
        const allInvoices = await prisma.factura.findMany({
            where: {
                cita: { pacienteId: patientId }
            },
            include: { pagos: true }
        });

        // Serialize BigInt
        const safeJSON = (data: any) => JSON.parse(JSON.stringify(data, (k, v) =>
            typeof v === 'bigint' ? v.toString() : v
        ));

        return NextResponse.json(safeJSON({
            patient,
            query1_pagos: pagos,
            query2_legacy: legacyInvoices,
            check_all_invoices: allInvoices
        }));

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
