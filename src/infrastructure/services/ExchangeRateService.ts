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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Try to get today's rate from DB
        const currentRate = await prisma.tasaDeCambio.findFirst({
            orderBy: { fecha: 'desc' }
        });

        // 2. If we have a rate from today, return it
        if (currentRate && currentRate.fecha >= today) {
            return currentRate;
        }

        // 3. If outdated or non-existent, try to fetch new rate
        if (currentRate?.esAutomatica !== false) { // Only auto-update if not disabled
            try {
                return await this.fetchAndStoreRate();
            } catch (error) {
                console.error("Failed to fetch external rate:", error);
                // Return old rate if fetch fails, better than nothing
                return currentRate;
            }
        }

        return currentRate;
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
