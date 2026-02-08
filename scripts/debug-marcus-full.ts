
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- START DEBUG ---");
        // 1. Find Patient
        const patient = await prisma.paciente.findFirst({
            where: { nombres: { contains: 'Marcus' } }
        });

        if (!patient) {
            console.log("Patient 'Marcus' not found.");
            return;
        }

        console.log(`Patient: ${patient.nombres} ${patient.apellidos} (ID: ${patient.pacienteId})`);

        // 2. Find Invoices via Appointments
        const invoices = await prisma.factura.findMany({
            where: {
                cita: { pacienteId: patient.pacienteId }
            },
            include: {
                pagos: true,
                cita: true
            }
        });

        console.log(`Found ${invoices.length} invoices linked to his appointments.`);

        for (const f of invoices) {
            console.log(`\n[Invoice #${f.numeroFactura || 'ID:' + f.facturaId}]`);
            console.log(`  Status: ${f.estadoFactura}`);
            console.log(`  Date: ${f.fechaEmision}`);
            console.log(`  Payments Linked: ${f.pagos.length}`);
            if (f.pagos.length > 0) {
                f.pagos.forEach(p => {
                    console.log(`    - Payment #${p.pagoId}: ${p.estadoPago} (${p.monto}$)`);
                });
            } else {
                console.log(`    - NO LINKED PAYMENTS`);
            }
        }

        // 3. Check for ORPHANED PAYMENTS? (Payments linked to invoices that might not be linked to appointments? Unlikely schema-wise but...)
        // Actually, let's just check ALL payments for relevant invoices.

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
