"use client";

import { useEffect, useState } from "react";
import { RefreshCw, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface ExchangeRate {
    valor: number;
    fecha: string;
    moneda: string;
    fuente: string;
}

export default function ExchangeRateWidget() {
    const [rate, setRate] = useState<ExchangeRate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchRate = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/config/exchange-rate", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                if (data.rate) {
                    setRate(data.rate);
                    setError(false);
                }
            } else {
                setError(true);
            }
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRate();
    }, []);

    const handleRefresh = (e: React.MouseEvent) => {
        e.preventDefault();
        fetchRate();
    };

    return (
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full px-4 py-1.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 text-lime-600 dark:text-lime-500">
                <div className="p-1 bg-lime-100 dark:bg-lime-900/30 rounded-full">
                    <DollarSign size={14} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Tasa BCV</span>
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />

            <div className="flex items-center gap-2">
                {loading ? (
                    <div className="h-4 w-16 bg-gray-100 dark:bg-zinc-800 animate-pulse rounded" />
                ) : error ? (
                    <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> Error
                    </span>
                ) : !rate ? (
                    <span className="text-sm font-bold text-gray-500">--.-- Bs</span>
                ) : (
                    <>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {Number(rate.valor).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                        </span>
                        <button
                            onClick={handleRefresh}
                            className="text-gray-400 hover:text-lime-600 transition-colors"
                            title="Actualizar Tasa"
                        >
                            <RefreshCw size={12} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
