import { prisma } from "@/infrastructure/database/prisma/client";

interface ExchangeRateData {
    price: number;
    title: string;
    last_update: string;
}

export class ExchangeRateService {
    private static API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

    /**
     * Fetches the current rate from the DB or updates it if stale (>24h).
     */
    async getCurrentRate() {
        // Always return the latest rate from DB â€” no auto-sync.
        // The rate is updated exclusively via the caja config panel.
        return await prisma.tasaDeCambio.findFirst({
            orderBy: { fecha: 'desc' }
        });
    }

    /**
     * Forces an update from the external API
     */
    async fetchAndStoreRate() {
        try {
            const response = await fetch(ExchangeRateService.API_URL);
            if (!response.ok) throw new Error("API Network error");

            const data = await response.json();
            // Data structure from DolarApi: { average: 55.45, ... } or { promedio: ... } based on screenshot and docs
            // Screenshot shows: "promedio": 0

            const rate = data.promedio || data.average; // Fallback just in case

            if (!rate || isNaN(rate)) throw new Error("Invalid API Data");

            const newRate = await prisma.tasaDeCambio.create({
                data: {
                    moneda: "USD",
                    valor: rate,
                    fuente: "DolarApi.com",
                    esAutomatica: true,
                    fecha: new Date()
                }
            });

            return newRate;

        } catch (error) {
            console.error("Error updating rate:", error);
            throw error;
        }
    }

    async updateManualRate(valor: number) {
        return await prisma.tasaDeCambio.create({
            data: {
                moneda: "USD",
                valor: valor,
                fuente: "Manual (Admin)",
                esAutomatica: false, // Flag as manual so autosync respects it? Or just history?
                // Actually, if manual, we might want to keep it until next auto check?
                // Let's keep it simple: just create record.
                fecha: new Date()
            }
        });
    }
}
