/**
 * Migration Script: Validate all PRESENCIAL+PENDIENTE payments
 * 
 * This script marks all payments with canalPago='PRESENCIAL' and
 * estadoPago='PENDIENTE' as VALIDADO, and updates their invoice balances.
 * 
 * Run with: npx tsx scripts/migrate-presencial-payments.ts
 */

import { prisma } from '../src/infrastructure/database/prisma/client';

async function main() {
    console.log('🔍 Buscando pagos PRESENCIAL pendientes...');

    const pendingPresencialPayments = await prisma.pago.findMany({
        where: {
            canalPago: 'PRESENCIAL',
            estadoPago: 'PENDIENTE',
        },
        include: {
            factura: true,
        },
    });

    if (pendingPresencialPayments.length === 0) {
        console.log('✅ No hay pagos PRESENCIAL pendientes. Nada que migrar.');
        return;
    }

    console.log(`📋 Encontrados ${pendingPresencialPayments.length} pago(s) para migrar:`);
    pendingPresencialPayments.forEach(p => {
        console.log(`  - Pago #${p.pagoId} | Factura #${p.facturaId} | Monto: $${p.monto}`);
    });

    console.log('\n⚙️  Iniciando migración en transacción...');

    await prisma.$transaction(async (tx) => {
        for (const pago of pendingPresencialPayments) {
            // 1. Mark payment as VALIDADO
            await tx.pago.update({
                where: { pagoId: pago.pagoId },
                data: { estadoPago: 'VALIDADO' },
            });

            // 2. Recalculate invoice balance using all validated payments
            const facturaId = pago.facturaId;
            const factura = pago.factura;

            const allValidatedPayments = await tx.pago.findMany({
                where: { facturaId, estadoPago: 'VALIDADO' },
            });

            const totalValidated = allValidatedPayments.reduce(
                (sum, p) => sum + Number(p.monto),
                0
            );

            const invoiceTotal = Number(factura.total);
            const insuredAmount = Number((factura as any).montoAsegurado || 0);
            const newBalance = Math.max(0, invoiceTotal - insuredAmount - totalValidated);

            let newStatus: string;
            if (newBalance <= 0.01) {
                newStatus = 'PAGADA';
            } else {
                newStatus = 'PARCIAL';
            }

            await (tx as any).factura.update({
                where: { facturaId },
                data: {
                    saldoPendiente: newBalance,
                    estadoFactura: newStatus,
                },
            });

            // 3. If fully paid and linked to emergency in ALTA, mark as ATENDIDO
            if (newStatus === 'PAGADA' && (factura as any).emergenciaId) {
                try {
                    const emergency = await (tx as any).emergencia.findUnique({
                        where: { emergenciaId: (factura as any).emergenciaId },
                    });
                    if (emergency && emergency.estadoEmergencia === 'ALTA') {
                        await (tx as any).emergencia.update({
                            where: { emergenciaId: emergency.emergenciaId },
                            data: { estadoEmergencia: 'ATENDIDO' },
                        });
                        console.log(`  🏥 Emergencia #${emergency.emergenciaId} marcada como ATENDIDO`);
                    }
                } catch (e) {
                    console.error(`  ⚠️  No se pudo actualizar emergencia para factura #${facturaId}:`, e);
                }
            }

            console.log(`  ✅ Pago #${pago.pagoId} validado | Factura #${facturaId} → ${newStatus} (saldo: $${newBalance.toFixed(2)})`);
        }
    }, {
        maxWait: 10000,
        timeout: 30000,
    });

    console.log('\n🎉 Migración completada exitosamente.');
}

main()
    .catch((e) => {
        console.error('❌ Error durante la migración:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
