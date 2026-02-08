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
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle size={12} /> Pagada</span>;

            case 'PENDIENTE':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-600 border border-yellow-100"><History size={12} /> Pendiente</span>;

            case 'POR PAGAR':
            case 'PARCIAL':
            case 'RESTANTE':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100"><AlertCircle size={12} /> Parcial</span>;

            case 'ANULADA':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200"><Ban size={12} /> Anulada</span>;

            case 'RECHAZADO':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100"><XCircle size={12} /> Rechazado</span>;

            default:
                return <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-200">{status}</span>;
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

                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Total Pagado</p>
                            <p className="text-lg font-bold text-gray-900">${summary.totalPagado.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="bg-red-50 p-2 rounded-lg text-red-500">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Por Pagar</p>
                            <p className="text-lg font-bold text-gray-900">${summary.totalPendiente.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-xl border-b border-gray-200 px-4 pt-4 flex gap-6">
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
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID Factura</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Concepto</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Total ($)</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Restante ($)</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Estado</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
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
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-5 text-sm font-mono text-gray-500">#{item.numeroFactura !== '-' ? item.numeroFactura : item.facturaId}</td>
                                                <td className="p-5 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="p-5 text-sm font-medium text-gray-700">{item.concept}</td>
                                                <td className="p-5 text-sm text-gray-500 text-right">${item.amountTotal.toFixed(2)}</td>
                                                <td className="p-5 text-sm font-bold text-red-600 text-right">
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
                                                                className="px-4 py-2 bg-yellow-100/50 text-yellow-700 text-xs font-bold rounded-lg cursor-not-allowed border border-yellow-200/50 flex items-center justify-center gap-1 mx-auto"
                                                            >
                                                                En Revisión
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleOpenPayment({ ...item, amountPending: maxPayable })}
                                                                className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                            >
                                                                Registrar Pago {/* (${maxPayable.toFixed(2)}) Option to show amount */}
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
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID Pago</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID Factura</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Concepto</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Método</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Destino</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Monto ($)</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Monto (Bs)</th>
                                    <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-12 text-center text-gray-400">
                                            <History size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>No hay historial de pagos registrado.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-5 text-sm font-mono text-gray-500">#{item.pagoId}</td>
                                            <td className="p-5 text-sm font-mono text-gray-400">#{item.facturaId}</td>
                                            <td className="p-5 text-sm text-gray-500 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="p-5 text-sm font-medium text-gray-700">{item.concept}</td>
                                            <td className="p-5 text-xs font-medium text-gray-400 uppercase tracking-wide">{item.method}</td>
                                            <td className="p-5 text-sm text-gray-500">{item.destination}</td>
                                            <td className="p-5 text-sm font-medium text-gray-700 text-right whitespace-nowrap">${item.amountUsd.toFixed(2)}</td>
                                            <td className="p-5 text-sm text-gray-400 text-right whitespace-nowrap">{item.status === 'VALIDADO' && item.amountBs > 0 ? `Bs ${item.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '-'}</td>
                                            <td className="p-5 text-right flex justify-end">
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
