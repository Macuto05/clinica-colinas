"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Ban, History, CreditCard, FileText, Banknote, XCircle, Search, X as XIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { PageLoader } from "@/components/ui/PageLoader";

const PAGE_SIZE = 10;

interface DebtItem {
    id: string;
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
    id: string;
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

    // ── Filtros Deudas ──────────────────────────────────────────────────────
    const [draftDebtEstado, setDraftDebtEstado] = useState('');
    const [appliedDebt, setAppliedDebt]         = useState({ estado: '' });
    const [debtPage, setDebtPage]               = useState(1);

    // ── Filtros Pagos ───────────────────────────────────────────────────────
    const [draftPayDesde, setDraftPayDesde] = useState('');
    const [draftPayHasta, setDraftPayHasta] = useState('');
    const [appliedPay, setAppliedPay]       = useState({ desde: '', hasta: '' });
    const [payPage, setPayPage]             = useState(1);

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
        fetchHistory();
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
        return <PageLoader message="Cargando finanzas..." minHeight="min-h-screen" />;
    }

    const totalPendingPayments = payments
        .filter(p => p.status === 'PENDIENTE')
        .reduce((sum, p) => sum + p.amountUsd, 0);

    // ── Computed Deudas ─────────────────────────────────────────────────────
    const filteredDebts = debts.filter(d => {
        if (appliedDebt.estado && d.status !== appliedDebt.estado) return false;
        return true;
    });
    const debtTotalPages = Math.max(1, Math.ceil(filteredDebts.length / PAGE_SIZE));
    const paginatedDebts = filteredDebts.slice((debtPage - 1) * PAGE_SIZE, debtPage * PAGE_SIZE);
    const debtHasFilters = !!appliedDebt.estado;

    // ── Computed Pagos ──────────────────────────────────────────────────────
    const filteredPays = payments.filter(p => {
        const pDate = p.date ? p.date.toString().split('T')[0] : '';
        if (appliedPay.desde && pDate < appliedPay.desde) return false;
        if (appliedPay.hasta && pDate > appliedPay.hasta) return false;
        return true;
    });
    const payTotalPages = Math.max(1, Math.ceil(filteredPays.length / PAGE_SIZE));
    const paginatedPays = filteredPays.slice((payPage - 1) * PAGE_SIZE, payPage * PAGE_SIZE);
    const payHasFilters = !!(appliedPay.desde || appliedPay.hasta);

    const handleBuscarDebt = () => { setAppliedDebt({ estado: draftDebtEstado }); setDebtPage(1); };
    const handleLimpiarDebt = () => { setDraftDebtEstado(''); setAppliedDebt({ estado: '' }); setDebtPage(1); };
    const handleBuscarPay = () => { setAppliedPay({ desde: draftPayDesde, hasta: draftPayHasta }); setPayPage(1); };
    const handleLimpiarPay = () => { setDraftPayDesde(''); setDraftPayHasta(''); setAppliedPay({ desde: '', hasta: '' }); setPayPage(1); };

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
                        className={`pb-4 px-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'debts' ? 'border-lime-500 text-lime-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText size={18} />
                        Deudas (Facturas)
                        {summary.totalPendiente > 0 && (
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">${summary.totalPendiente.toFixed(2)}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 px-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'history' ? 'border-lime-500 text-lime-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Banknote size={18} />
                        Historial de Pagos
                        {totalPendingPayments > 0 && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs box-border border-yellow-200 border">${totalPendingPayments.toFixed(2)}</span>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-6 space-y-4">

                    {/* ── TAB: DEUDAS ──────────────────────────────────── */}
                    {activeTab === 'debts' && (
                        <>
                            {/* Filter Bar */}
                            <div className="bg-white/50 backdrop-blur-md rounded-[1.5rem] border border-white/60 shadow-sm p-5">
                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="space-y-1.5 min-w-[200px]">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Estado de la factura</label>
                                        <select
                                            value={draftDebtEstado}
                                            onChange={e => setDraftDebtEstado(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/70 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all cursor-pointer"
                                        >
                                            <option value="">Todos los estados</option>
                                            <option value="PENDIENTE">Pendiente</option>
                                            <option value="PARCIAL">Parcial</option>
                                            <option value="PAGADA">Pagada</option>
                                            <option value="EN_REVISION">En Revisión</option>
                                            <option value="ANULADA">Anulada</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleBuscarDebt}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-lime-500 hover:bg-lime-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                                    >
                                        <Search size={15} /> Buscar
                                    </button>
                                    {debtHasFilters && (
                                        <>
                                            <button
                                                onClick={handleLimpiarDebt}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-white/60 border border-white/70 text-gray-600 text-sm font-bold rounded-xl hover:bg-white transition-all"
                                            >
                                                <XIcon size={14} /> Limpiar
                                            </button>
                                            <span className="text-xs font-bold text-gray-500 bg-white/60 border border-white/70 rounded-xl px-3 py-1.5 ml-auto">
                                                {filteredDebts.length} resultado{filteredDebts.length !== 1 ? 's' : ''}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-[1.5rem] shadow-sm border border-white/60 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/50 border-b border-gray-100">
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider hidden sm:table-cell">ID Factura</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Concepto</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right hidden md:table-cell">Total ($)</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Restante ($)</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Estado</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredDebts.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center text-gray-400">
                                                    <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                                    <p>{debtHasFilters ? 'Sin facturas para los filtros aplicados.' : 'No tienes historial de facturas.'}</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedDebts.map((item) => {
                                                const pendingForInvoice = payments
                                                    .filter(p => p.facturaId === item.facturaId && p.status === 'PENDIENTE')
                                                    .reduce((sum, p) => sum + p.amountUsd, 0);
                                                const maxPayable = Math.max(0, item.amountPending - pendingForInvoice);
                                                const isFullyInReview = maxPayable <= 0.01;
                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-5 px-6 text-sm font-bold text-gray-600 hidden sm:table-cell">#{item.numeroFactura !== '-' ? item.numeroFactura : item.facturaId}</td>
                                                        <td className="p-5 px-6 text-sm font-medium text-gray-600 hidden md:table-cell">{new Date(item.date).toLocaleDateString('es-VE')}</td>
                                                        <td className="p-5 px-6 text-sm font-bold text-gray-800">{item.concept}</td>
                                                        <td className="p-5 px-6 text-sm font-bold text-gray-600 text-right hidden md:table-cell">${item.amountTotal.toFixed(2)}</td>
                                                        <td className="p-5 px-6 text-sm font-black text-rose-600 text-right">
                                                            {item.status === 'ANULADA' ? '-' : `$${item.amountPending.toFixed(2)}`}
                                                            {pendingForInvoice > 0 && item.status !== 'ANULADA' && (
                                                                <div className="text-[10px] text-yellow-600 font-normal mt-1 flex justify-end gap-1 items-center">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                                                    -${pendingForInvoice.toFixed(2)} en revisión
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-5 text-right">{getStatusBadge(item.status)}</td>
                                                        <td className="p-5 text-center">
                                                            {(item.status === 'PENDIENTE' || item.status === 'PARCIAL') ? (
                                                                isFullyInReview ? (
                                                                    <button disabled className="px-5 py-2 bg-amber-500/10 text-amber-700 text-xs font-bold rounded-xl cursor-not-allowed border border-amber-500/20 flex items-center justify-center gap-1 mx-auto shadow-inner">
                                                                        En Revisión
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleOpenPayment({ ...item, amountPending: maxPayable })}
                                                                        className="px-5 py-2.5 bg-lime-500/95 hover:bg-lime-600 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(132,204,22,0.3)] border border-lime-400/50"
                                                                    >
                                                                        Pagar Ahora
                                                                    </button>
                                                                )
                                                            ) : (
                                                                <span className="text-xs text-gray-400 font-medium italic">{item.status === 'ANULADA' ? 'Anulada' : 'Pagada'}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination - Deudas */}
                            {debtTotalPages > 1 && (
                                <div className="flex items-center justify-between bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 px-5 py-3 shadow-sm">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {(debtPage - 1) * PAGE_SIZE + 1}–{Math.min(debtPage * PAGE_SIZE, filteredDebts.length)} de {filteredDebts.length}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setDebtPage(p => p - 1)} disabled={debtPage === 1} className="p-2 rounded-xl bg-white/60 border border-white/70 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-xs font-black text-gray-600 bg-white/60 border border-white/70 rounded-xl px-4 py-2 min-w-[70px] text-center">{debtPage} / {debtTotalPages}</span>
                                        <button onClick={() => setDebtPage(p => p + 1)} disabled={debtPage === debtTotalPages} className="p-2 rounded-xl bg-white/60 border border-white/70 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── TAB: HISTORIAL DE PAGOS ───────────────────────── */}
                    {activeTab === 'history' && (
                        <>
                            {/* Filter Bar */}
                            <div className="bg-white/50 backdrop-blur-md rounded-[1.5rem] border border-white/60 shadow-sm p-5">
                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Desde</label>
                                        <input
                                            type="date"
                                            value={draftPayDesde}
                                            onChange={e => setDraftPayDesde(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/70 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Hasta</label>
                                        <input
                                            type="date"
                                            value={draftPayHasta}
                                            onChange={e => setDraftPayHasta(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/70 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                        />
                                    </div>
                                    <button onClick={handleBuscarPay} className="flex items-center gap-2 px-5 py-2.5 bg-lime-500 hover:bg-lime-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
                                        <Search size={15} /> Buscar
                                    </button>
                                    {payHasFilters && (
                                        <>
                                            <button onClick={handleLimpiarPay} className="flex items-center gap-2 px-5 py-2.5 bg-white/60 border border-white/70 text-gray-600 text-sm font-bold rounded-xl hover:bg-white transition-all">
                                                <XIcon size={14} /> Limpiar filtros
                                            </button>
                                            <span className="ml-auto text-xs font-bold text-gray-500 bg-white/60 border border-white/70 rounded-xl px-3 py-1.5">
                                                {filteredPays.length} resultado{filteredPays.length !== 1 ? 's' : ''}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-[1.5rem] shadow-sm border border-white/60 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/50 border-b border-gray-100">
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider hidden sm:table-cell">ID Pago</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider hidden md:table-cell">ID Factura</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Concepto</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Método</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Destino</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Monto ($)</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right whitespace-nowrap hidden sm:table-cell">Monto (Bs)</th>
                                            <th className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredPays.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="p-12 text-center text-gray-400">
                                                    <History size={48} className="mx-auto mb-3 opacity-20" />
                                                    <p>{payHasFilters ? 'Sin pagos para el rango de fechas seleccionado.' : 'No hay historial de pagos registrado.'}</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedPays.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-5 px-6 text-sm font-bold text-gray-600 hidden sm:table-cell">#{item.pagoId}</td>
                                                    <td className="p-5 px-6 text-sm font-bold text-gray-500 hidden md:table-cell">#{item.facturaId}</td>
                                                    <td className="p-5 px-6 text-sm font-medium text-gray-600 whitespace-nowrap hidden md:table-cell">{new Date(item.date).toLocaleDateString('es-VE')}</td>
                                                    <td className="p-5 px-6 text-sm font-bold text-gray-800">{item.concept}</td>
                                                    <td className="p-5 px-6 text-xs font-black text-gray-500 uppercase tracking-wide hidden lg:table-cell">{item.method}</td>
                                                    <td className="p-5 px-6 text-sm font-medium text-gray-600 hidden lg:table-cell">{item.destination}</td>
                                                    <td className="p-5 px-6 text-sm font-bold text-gray-800 text-right whitespace-nowrap">${item.amountUsd.toFixed(2)}</td>
                                                    <td className="p-5 px-6 text-sm font-medium text-gray-500 text-right whitespace-nowrap hidden sm:table-cell">{item.amountBs > 0 ? `Bs ${item.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '-'}</td>
                                                    <td className="p-5 px-6 text-right">{getStatusBadge(item.status)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination - Pagos */}
                            {payTotalPages > 1 && (
                                <div className="flex items-center justify-between bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 px-5 py-3 shadow-sm">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {(payPage - 1) * PAGE_SIZE + 1}–{Math.min(payPage * PAGE_SIZE, filteredPays.length)} de {filteredPays.length}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPayPage(p => p - 1)} disabled={payPage === 1} className="p-2 rounded-xl bg-white/60 border border-white/70 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-xs font-black text-gray-600 bg-white/60 border border-white/70 rounded-xl px-4 py-2 min-w-[70px] text-center">{payPage} / {payTotalPages}</span>
                                        <button onClick={() => setPayPage(p => p + 1)} disabled={payPage === payTotalPages} className="p-2 rounded-xl bg-white/60 border border-white/70 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedDebt && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    invoiceId={selectedDebt.facturaId}
                    totalAmount={selectedDebt.amountPending}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
