"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Ban, History, CreditCard, FileText, Banknote, XCircle } from "lucide-react";
import { PaymentModal } from "@/components/billing/PaymentModal";

interface DebtItem {
    id: string; // INV-123
    facturaId: string;
    numeroFactura: string;
    type: 'DEBT';
    date: string;
    concept: string;
    amountTotal: number;
    amountPending: number;
    status: string;
}

interface PaymentItem {
    id: string; // PAY-456
    pagoId: string;
    facturaId: string;
    type: 'PAYMENT';
    date: string;
    concept: string;
    method: string;
    destination: string;
    reference: string;
    amountUsd: number;
    amountBs: number;
    status: string;
}

interface Summary {
    totalPagado: number;
    totalPendiente: number;
}

export default function FinancialHistoryPage() {
    const { user, loading: authLoading } = useAuth();

    // Data State
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalPagado: 0, totalPendiente: 0 });
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<'debts' | 'history'>('debts');

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const patientId = (user as any).patientId;
            if (!patientId) return;

            const res = await fetch(`/api/billing/history?patientId=${patientId}`);
            if (res.ok) {
                const data = await res.json();
                setDebts(data.debts);
                setPayments(data.payments);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error("Error fetching history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchHistory();
    }, [user]);

    const handleOpenPayment = (debt: DebtItem) => {
        setSelectedDebt(debt);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        // Refresh data
        fetchHistory();
        // Typically also switch to History tab to show the new pending payment?
        // Let's ask user later. For now, just refresh.
        // Actually, switching to History makes sense so they see "En Revisión".
        setActiveTab('history');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VALIDADO':
            case 'PAGADA':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 backdrop-blur-sm shadow-inner"><CheckCircle size={12} /> Pagada</span>;

            case 'PENDIENTE':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30 backdrop-blur-sm shadow-inner"><History size={12} /> Pendiente</span>;

            case 'POR PAGAR':
            case 'PARCIAL':
            case 'RESTANTE':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-800 border border-rose-500/30 backdrop-blur-sm shadow-inner"><AlertCircle size={12} /> Parcial</span>;

            case 'ANULADA':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/40 text-gray-600 border border-white/60 backdrop-blur-sm shadow-sm"><Ban size={12} /> Anulada</span>;

            case 'RECHAZADO':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-800 border border-red-500/30 backdrop-blur-sm shadow-inner"><XCircle size={12} /> Rechazado</span>;

            default:
                return <span className="px-3 py-1.5 bg-white/40 text-gray-700 rounded-full text-xs font-bold border border-white/60 backdrop-blur-sm shadow-sm">{status}</span>;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
            </div>
        );
    }

    const totalPendingPayments = payments
        .filter(p => p.status === 'PENDIENTE')
        .reduce((sum, p) => sum + p.amountUsd, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header & Summary */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Finanzas</h1>
                    <p className="text-gray-500">Gestiona tus pagos pendientes y revisa tu historial.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="bg-white/50 backdrop-blur-md px-5 py-3 rounded-2xl shadow-sm border border-white/60 flex items-center gap-4 transition-all hover:bg-white/60">
                        <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-700 border border-emerald-500/20 shadow-inner block">
                            <CheckCircle size={22} className="opacity-90" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Pagado</p>
                            <p className="text-xl font-bold text-gray-900 leading-none">${summary.totalPagado.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-md px-5 py-3 rounded-2xl shadow-sm border border-white/60 flex items-center gap-4 transition-all hover:bg-white/60">
                        <div className="bg-rose-500/10 p-2.5 rounded-xl text-rose-700 border border-rose-500/20 shadow-inner block">
                            <AlertCircle size={22} className="opacity-90" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Por Pagar</p>
                            <p className="text-xl font-bold text-gray-900 leading-none">${summary.totalPendiente.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden flex flex-col">
                
                {/* Tabs */}
                <div className="bg-white/30 backdrop-blur-sm border-b border-white/50 px-6 sm:px-8 pt-6 flex gap-8">
                <button
                    onClick={() => setActiveTab('debts')}
                    className={`pb-4 px-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'debts'
                        ? 'border-lime-500 text-lime-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FileText size={18} />
                    Deudas (Facturas)
                    {summary.totalPendiente > 0 && (
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                            ${summary.totalPendiente.toFixed(2)}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 px-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'history'
                        ? 'border-lime-500 text-lime-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Banknote size={18} />
                    Historial de Pagos
                    {totalPendingPayments > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs box-border border-yellow-200 border">
                            ${totalPendingPayments.toFixed(2)}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-xl shadow-sm border-x border-b border-gray-200 overflow-hidden min-h-[400px]">

                {/* DEBTS TABLE */}
                {activeTab === 'debts' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/50 border-b border-white/60 backdrop-blur-md">
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">ID Factura</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Concepto</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Total ($)</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Restante ($)</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Estado</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/30">
                                {debts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-400">
                                            <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>No tienes historial de facturas.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    debts.map((item) => {
                                        // Calculate Pending Payments for this specific Invoice
                                        const pendingForInvoice = payments
                                            .filter(p => p.facturaId === item.facturaId && p.status === 'PENDIENTE')
                                            .reduce((sum, p) => sum + p.amountUsd, 0);

                                        const maxPayable = Math.max(0, item.amountPending - pendingForInvoice);
                                        const isFullyInReview = maxPayable <= 0.01; // Epsilon for float

                                        return (
                                            <tr key={item.id} className="hover:bg-white/60 transition-colors border-b border-white/20 last:border-none">
                                                <td className="p-5 px-6 text-sm font-bold text-gray-600">#{item.numeroFactura !== '-' ? item.numeroFactura : item.facturaId}</td>
                                                <td className="p-5 px-6 text-sm font-medium text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="p-5 px-6 text-sm font-bold text-gray-800">{item.concept}</td>
                                                <td className="p-5 px-6 text-sm font-bold text-gray-600 text-right">${item.amountTotal.toFixed(2)}</td>
                                                <td className="p-5 px-6 text-sm font-black text-rose-600 text-right">
                                                    {item.status === 'ANULADA' ? '-' : `$${item.amountPending.toFixed(2)}`}
                                                    {pendingForInvoice > 0 && item.status !== 'ANULADA' && (
                                                        <div className="text-[10px] text-yellow-600 font-normal mt-1 flex justify-end gap-1 items-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                                            -${pendingForInvoice.toFixed(2)} en revisión
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-5 text-right flex justify-end">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="p-5 text-center">
                                                    {(item.status === 'PENDIENTE' || item.status === 'PARCIAL') ? (
                                                        isFullyInReview ? (
                                                            <button
                                                                disabled
                                                                className="px-5 py-2 bg-amber-500/10 text-amber-700 text-xs font-bold rounded-xl cursor-not-allowed border border-amber-500/20 flex items-center justify-center gap-1 mx-auto shadow-inner backdrop-blur-sm"
                                                            >
                                                                En Revisión
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleOpenPayment({ ...item, amountPending: maxPayable })}
                                                                className="px-5 py-2.5 bg-lime-500/95 hover:bg-lime-600 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(132,204,22,0.3)] border border-lime-400/50 hover:shadow-md focus:ring-2 focus:ring-lime-300"
                                                            >
                                                                Pagar Ahora
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-gray-400 font-medium italic select-none">
                                                            {item.status === 'ANULADA' ? 'Anulada' : 'Pagada'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* HISTORY TABLE */}
                {activeTab === 'history' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/50 border-b border-white/60 backdrop-blur-md">
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">ID Pago</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">ID Factura</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Concepto</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Método</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Destino</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Monto ($)</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Monto (Bs)</th>
                                    <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/30">
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-12 text-center text-gray-400">
                                            <History size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>No hay historial de pagos registrado.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/60 transition-colors border-b border-white/20 last:border-none">
                                            <td className="p-5 px-6 text-sm font-bold text-gray-600">#{item.pagoId}</td>
                                            <td className="p-5 px-6 text-sm font-bold text-gray-500">#{item.facturaId}</td>
                                            <td className="p-5 px-6 text-sm font-medium text-gray-600 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="p-5 px-6 text-sm font-bold text-gray-800">{item.concept}</td>
                                            <td className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wide">{item.method}</td>
                                            <td className="p-5 px-6 text-sm font-medium text-gray-600">{item.destination}</td>
                                            <td className="p-5 px-6 text-sm font-bold text-gray-800 text-right whitespace-nowrap">${item.amountUsd.toFixed(2)}</td>
                                            <td className="p-5 px-6 text-sm font-medium text-gray-500 text-right whitespace-nowrap">{item.status === 'VALIDADO' && item.amountBs > 0 ? `Bs ${item.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '-'}</td>
                                            <td className="p-5 px-6 text-right flex justify-end">
                                                {getStatusBadge(item.status)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedDebt && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    invoiceId={selectedDebt.facturaId}
                    totalAmount={selectedDebt.amountPending} // Pay the REMAINING Amount by default
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
