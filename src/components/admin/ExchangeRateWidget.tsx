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
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-full px-5 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(132,204,22,0.1)] transition-all duration-300 group">
            <div className="flex items-center gap-2 text-lime-600">
                <div className="p-1.5 bg-lime-500/20 rounded-full shadow-[0_0_10px_rgba(132,204,22,0.2)] group-hover:bg-lime-500 group-hover:text-white transition-all duration-300">
                    <DollarSign size={14} strokeWidth={3} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tasa BCV</span>
            </div>

            <div className="h-5 w-px bg-white/40" />

            <div className="flex items-center gap-3">
                {loading ? (
                    <div className="h-4 w-16 bg-white/30 animate-pulse rounded-full" />
                ) : error ? (
                    <span className="text-[10px] font-black text-red-500 flex items-center gap-1 uppercase tracking-wider">
                        <AlertCircle size={14} /> Error
                    </span>
                ) : !rate ? (
                    <span className="text-sm font-black text-gray-500/60 uppercase tracking-tighter italic">--.-- Bs</span>
                ) : (
                    <>
                        <span className="text-sm font-black text-gray-800 tracking-tight">
                            {Number(rate.valor).toLocaleString('es-VE', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-400">Bs</span>
                        </span>
                        <button
                            onClick={handleRefresh}
                            className="text-gray-400 hover:text-lime-600 hover:rotate-180 transition-all duration-500 p-1"
                            title="Actualizar Tasa"
                        >
                            <RefreshCw size={12} strokeWidth={2.5} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
