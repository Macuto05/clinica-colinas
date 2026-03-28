"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Search, Calendar, CreditCard, User, FileText, DollarSign, Wallet, Building, Monitor, HandCoins, ArrowRight, Banknote } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";

// --- Interfaces ---

interface PendingPayment {
    pagoId: string;
    monto: number;
    montoBs: number;
    fecha: string;
    metodo: string;
    referencia: string | null;
    paciente: string;
    cedula: string;
    facturaId: string;
    saldoFactura: number;
    estado: string;
    bancoDepositado?: string | null;
    canal?: string;
    numeroFactura?: string | null;
    fechaRegistro?: string; // System Timestamp
}

interface PendingInvoice {
    facturaId: string;
    numeroFactura: string | null;
    fechaEmision: string;
    paciente: string;
    cedula: string;
    doctor: string;
    total: number;
    saldoPendiente: number;
}

// --- Payment Modal Component ---

interface ManualPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: PendingInvoice | null;
    existingPayment?: PendingPayment; // Added prop
    onSuccess: () => void;
}

function ManualPaymentModal({ isOpen, onClose, invoice, existingPayment, onSuccess }: ManualPaymentModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'TRANSFERENCIA' | 'EFECTIVO' | 'PUNTO'>('TRANSFERENCIA');
    const [loading, setLoading] = useState(false);

    // Data
    const [banks, setBanks] = useState<any[]>([]);
    const [methods, setMethods] = useState<any[]>([]);
    const [exchangeRate, setExchangeRate] = useState(0);

    // Form
    const [amount, setAmount] = useState("");
    const [amountBs, setAmountBs] = useState(""); // Added state
    const [reference, setReference] = useState("");
    const [selectedBankId, setSelectedBankId] = useState("");

    // Effect 1: Load Data
    useEffect(() => {
        if (isOpen) {
            Promise.all([
                fetch("/api/billing/accounts").then(r => r.json()),
                fetch("/api/billing/methods").then(r => r.json()),
                fetch("/api/billing/config").then(r => r.json())
            ]).then(([banksData, methodsData, configData]) => {
                setBanks(banksData);
                setMethods(methodsData);
                setExchangeRate(configData.tasa || 0);
            });
        }
    }, [isOpen]);

    // Effect 2: Initialize Form
    useEffect(() => {
        if (isOpen && invoice) {
            const tasa = exchangeRate || 0;
            if (existingPayment) {
                setAmount(existingPayment.monto.toString());
                if (tasa > 0) setAmountBs((existingPayment.monto * tasa).toFixed(2));
            } else {
                setAmount(invoice.saldoPendiente.toString());
                if (tasa > 0) setAmountBs((invoice.saldoPendiente * tasa).toFixed(2));
            }
        }
    }, [isOpen, invoice, existingPayment, exchangeRate]);

    const handleAmountChange = (val: string) => {
        let newAmount = val;
        // Check Limit (Max = Saldo Pendiente)
        if (invoice && parseFloat(newAmount) > invoice.saldoPendiente) {
            newAmount = invoice.saldoPendiente.toString();
            toast.info("El monto no puede exceder el saldo pendiente");
        }

        setAmount(newAmount);
        if (exchangeRate > 0 && newAmount) {
            const num = parseFloat(newAmount);
            if (!isNaN(num)) {
                setAmountBs((num * exchangeRate).toFixed(2));
            } else {
                setAmountBs("");
            }
        } else {
            setAmountBs("");
        }
    };

    const handleAmountBsChange = (val: string) => {
        let newBs = val;

        if (exchangeRate > 0 && newBs && invoice) {
            const numBs = parseFloat(newBs);
            const calculatedUsd = numBs / exchangeRate;

            if (calculatedUsd > invoice.saldoPendiente) {
                const maxBs = invoice.saldoPendiente * exchangeRate;
                newBs = maxBs.toFixed(2);
                toast.info("El monto no puede exceder el saldo pendiente");
                setAmount(invoice.saldoPendiente.toString());
            } else {
                setAmount(calculatedUsd.toFixed(2));
            }
        } else {
            setAmount("");
        }

        setAmountBs(newBs);
    };

    const handleSubmit = async () => {
        if (!invoice) return;
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Ingresa un monto válido");
            return;
        }

        // Find Method ID based on active tab
        let methodId = "";
        let finalReference = reference;

        if (activeTab === 'TRANSFERENCIA') {
            const m = methods.find((m: any) => m.nombre === 'TRANSFERENCIA');
            if (m) methodId = m.id;
            if (!selectedBankId) { toast.error("Selecciona cuenta destino"); return; }
            if (!reference) { toast.error("Ingresa referencia"); return; }
        } else if (activeTab === 'EFECTIVO') {
            const m = methods.find((m: any) => m.nombre === 'EFECTIVO');
            if (m) methodId = m.id;
            finalReference = reference || "EFECTIVO-CAJA";
        } else if (activeTab === 'PUNTO') {
            const m = methods.find((m: any) => m.nombre === 'PUNTO');
            if (!m) {
                const card = methods.find((m: any) => m.nombre.includes('TARJETA') || m.nombre.includes('DEBITO'));
                if (card) methodId = card.id;
            } else {
                methodId = m.id;
            }
            if (!selectedBankId) { toast.error("Selecciona cuenta destino (Punto)"); return; }
            if (!reference) { toast.error("Ingresa referencia/lote"); return; }
        }

        if (!methodId) {
            toast.error(`Método de pago ${activeTab} no configurado en sistema`);
            return;
        }

        setLoading(true);
        try {
            let res;
            if (existingPayment) {
                // COMPLETION FLOW
                const payload = {
                    metodoPagoId: methodId,
                    montoBs: parseFloat(amountBs), // Calculated Bs
                    tasaCambio: exchangeRate,
                    referencia: finalReference,
                    cuentaDestinoId: (activeTab === 'TRANSFERENCIA' || activeTab === 'PUNTO') ? selectedBankId : null,
                    usuarioId: user?.id || 1
                };

                res = await fetch(`/api/billing/payments/${existingPayment.pagoId}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                // NEW PAYMENT FLOW
                const payload = {
                    facturaId: invoice.facturaId,
                    monto: parseFloat(amount),
                    metodoPagoId: methodId,
                    referencia: finalReference,
                    cuentaDestinoId: (activeTab === 'TRANSFERENCIA' || activeTab === 'PUNTO') ? selectedBankId : null,
                    canalPago: "PRESENCIAL", // Important marker
                    usuarioId: user?.id || 1
                };

                res = await fetch("/api/billing/payments/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                toast.success(existingPayment ? "Pago completado y validado" : "Pago registrado correctamente");
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                toast.error(err.error || "Error al procesar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
        setLoading(false);
    };

    if (!isOpen || !invoice) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Cobrar Factura #${invoice.numeroFactura || invoice.facturaId || '---'}`}>
            <div className="space-y-6">
                {/* Header Summary */}
                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl flex justify-between items-center border border-white/50 shadow-inner">
                    <div>
                        <p className="text-xs text-gray-500/80 uppercase font-bold tracking-wider mb-1">Total a Pagar</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tight">${invoice.saldoPendiente.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500/80 uppercase font-bold tracking-wider mb-1">Paciente</p>
                        <p className="text-sm font-bold text-gray-800 bg-white/50 px-3 py-1.5 rounded-xl border border-white/60 shadow-sm">{invoice.paciente}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1.5 bg-white/30 backdrop-blur-md border border-white/40 shadow-inner rounded-2xl">
                    {[
                        { id: 'TRANSFERENCIA', icon: <Building size={16} />, label: 'Transferencia' },
                        { id: 'EFECTIVO', icon: <Banknote size={16} />, label: 'Efectivo $' },
                        { id: 'PUNTO', icon: <CreditCard size={16} />, label: 'Punto Venta' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all
                                ${activeTab === tab.id
                                    ? 'bg-white/80 text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/60'
                                    : 'text-gray-500/80 hover:bg-white/40'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider pl-1">Monto ($)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => handleAmountChange(e.target.value)}
                            className="w-full mt-1.5 p-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-lg font-black shadow-inner transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider pl-1">Monto (Bs)</label>
                        <input
                            type="number"
                            value={amountBs}
                            onChange={e => handleAmountBsChange(e.target.value)}
                            className="w-full mt-1.5 p-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-lg font-black shadow-inner transition-all placeholder:text-gray-400"
                            placeholder="0.00"
                        />
                        <div className="mt-2 flex justify-end">
                            <span className="text-xs font-bold text-gray-500/70 bg-white/40 px-2 py-1 rounded-lg">Tasa: Bs. {exchangeRate}</span>
                        </div>
                    </div>
                </div>

                {/* Conditional Fields */}
                {(activeTab === 'TRANSFERENCIA' || activeTab === 'PUNTO') && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider pl-1 mb-2 block">
                                {activeTab === 'PUNTO' ? 'Cuenta Destino (Punto Asociado)' : 'Cuenta Destino'}
                            </label>
                            <div className="grid grid-cols-1 gap-2.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {banks.map(b => (
                                    <button
                                        key={b.cuentaId}
                                        onClick={() => setSelectedBankId(b.cuentaId.toString())}
                                        className={`text-left p-3.5 rounded-2xl border transition-all shadow-sm backdrop-blur-sm
                                            ${selectedBankId === b.cuentaId.toString()
                                                ? 'border-lime-300 bg-lime-50/80 ring-1 ring-lime-400/50'
                                                : 'border-white/60 bg-white/40 hover:bg-white/60 hover:border-white/80'}`}
                                    >
                                        <div className={`font-bold text-sm ${selectedBankId === b.cuentaId.toString() ? 'text-lime-900' : 'text-gray-800'}`}>{b.banco}</div>
                                        <div className={`flex justify-between text-xs mt-1 font-medium ${selectedBankId === b.cuentaId.toString() ? 'text-lime-700/80' : 'text-gray-500'}`}>
                                            <span className="font-mono">{b.numeroCuenta}</span>
                                            <span>{b.titular}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider pl-1">
                                {activeTab === 'PUNTO' ? 'Nro. Referencia' : 'Nro. Referencia'}
                            </label>
                            <input
                                value={reference}
                                onChange={e => setReference(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full mt-1.5 p-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                placeholder={activeTab === 'PUNTO' ? "Solo números" : "Solo números"}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'EFECTIVO' && (
                    <div className="bg-orange-50/80 backdrop-blur-md p-5 rounded-3xl border border-orange-200/50 text-orange-900 text-sm flex items-start gap-4 shadow-inner">
                        <div className="p-2 bg-orange-100/80 rounded-xl text-orange-600 border border-orange-200 shadow-sm mt-0.5">
                            <Wallet size={18} />
                        </div>
                        <div>
                            <p className="font-bold mb-1">Pago en Efectivo</p>
                            <p className="font-medium opacity-80 leading-relaxed">Asegúrate de recibir el dinero completo antes de registrar. Si hay cambio pendiente, regístralo en las notas si es necesario.</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 bg-lime-500/95 hover:bg-lime-500 text-white font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 disabled:opacity-50 disabled:shadow-none text-sm tracking-wide"
                >
                    {loading ? "Procesando..." : "Confirmar Cobro"}
                </button>
            </div>
        </Modal>
    );
}

// --- Main Page Component ---

export default function PagosiPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'REGISTRAR' | 'VALIDAR' | 'HISTORIAL'>('REGISTRAR');

    // Data State
    const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
    const [pagos, setPagos] = useState<PendingPayment[]>([]);
    const [historyPagos, setHistoryPagos] = useState<PendingPayment[]>([]);

    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // Correctly using boolean state
    const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoice | null>(null);

    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRegisterDate, setFilterRegisterDate] = useState("");
    const [filterPaymentDate, setFilterPaymentDate] = useState("");

    // Validar Filters State
    const [valSearchTerm, setValSearchTerm] = useState("");
    const [valFilterRegisterDate, setValFilterRegisterDate] = useState("");
    const [valFilterPaymentDate, setValFilterPaymentDate] = useState("");

    const loadData = (
        historyFilters?: { search?: string, dateRegister?: string, datePayment?: string },
        validFilters?: { search?: string, dateRegister?: string, datePayment?: string }
    ) => {
        setLoading(true);

        // Pending Invoices (No changes)
        const p1 = fetch("/api/billing/pending-invoices").then(r => r.json()).then(d => Array.isArray(d) && setPendingInvoices(d));

        // --- VALIDAR FILTERS ---
        const vSearch = validFilters?.search !== undefined ? validFilters.search : valSearchTerm;
        const vRegister = validFilters?.dateRegister !== undefined ? validFilters.dateRegister : valFilterRegisterDate;
        const vPayment = validFilters?.datePayment !== undefined ? validFilters.datePayment : valFilterPaymentDate;

        const paramsVal = new URLSearchParams();
        paramsVal.append('status', 'PENDIENTE');
        if (vSearch) paramsVal.append('search', vSearch);
        if (vRegister) paramsVal.append('dateRegister', vRegister);
        if (vPayment) paramsVal.append('datePayment', vPayment);

        const p2 = fetch(`/api/billing/payments?${paramsVal.toString()}`).then(r => r.json()).then(d => Array.isArray(d) && setPagos(d));

        // --- HISTORY FILTERS ---
        // Determine values to use (Override > State)
        const activeSearch = historyFilters?.search !== undefined ? historyFilters.search : searchTerm;
        const activeRegister = historyFilters?.dateRegister !== undefined ? historyFilters.dateRegister : filterRegisterDate;
        const activePayment = historyFilters?.datePayment !== undefined ? historyFilters.datePayment : filterPaymentDate;

        // Build History URL with Filters
        const params = new URLSearchParams();
        params.append('status', 'HISTORIAL');
        if (activeSearch) params.append('search', activeSearch);
        if (activeRegister) params.append('dateRegister', activeRegister);
        if (activePayment) params.append('datePayment', activePayment);

        const p3 = fetch(`/api/billing/payments?${params.toString()}`).then(r => r.json()).then(d => Array.isArray(d) && setHistoryPagos(d));

        Promise.all([p1, p2, p3])
            .catch(() => toast.error("Error actualizando datos"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleApprove = async (pagoId: string) => {
        if (!confirm("¿Confirmas que recibiste este dinero en el banco?")) return;
        setProcessingId(pagoId);
        try {
            const res = await fetch(`/api/billing/payments/${pagoId}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuarioId: (user as any)?.usuarioId || 1 })
            });

            if (res.ok) {
                toast.success("Pago validado correctamente");
                loadData();
            } else {
                toast.error("Error al validar");
            }
        } catch { toast.error("Error de conexión"); }
        setProcessingId(null);
    };

    const handleReject = async (pagoId: string) => {
        if (!confirm("¿Estás seguro de RECHAZAR este pago? El paciente deberá registrarlo nuevamente.")) return;
        setProcessingId(pagoId);
        try {
            const res = await fetch(`/api/billing/payments/${pagoId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuarioId: (user as any)?.usuarioId || 1 })
            });

            if (res.ok) {
                toast.success("Pago rechazado correctamente");
                loadData();
            } else {
                toast.error("Error al rechazar");
            }
        } catch { toast.error("Error de conexión"); }
        setProcessingId(null);
    };

    const handleOpenPayment = (invoice: PendingInvoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                        <Wallet className="text-lime-600 drop-shadow-sm" />
                        Gestión de Pagos
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Registra cobros presenciales y valida transferencias online.</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div>
                <nav className="inline-flex gap-2 p-1.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('REGISTRAR')}
                        className={`py-2 px-5 inline-flex items-center gap-2 rounded-2xl font-bold text-sm transition-all ${activeTab === 'REGISTRAR'
                            ? 'bg-white/80 text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/60'
                            : 'text-gray-500/80 hover:bg-white/40 border border-transparent'
                            }`}
                    >
                        <HandCoins size={18} />
                        Registrar Cobro
                        {/* Show count of Presencial Requests + Pending Invoices if needed, or just Presencial */}
                        {pagos.filter(p => p.canal === 'PRESENCIAL').length > 0 && (
                            <span className="ml-2 py-0.5 px-2 rounded-full bg-purple-100 text-purple-700 text-xs border border-purple-200/50 shadow-sm animate-pulse">
                                {pagos.filter(p => p.canal === 'PRESENCIAL').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('VALIDAR')}
                        className={`py-2 px-5 inline-flex items-center gap-2 rounded-2xl font-bold text-sm transition-all ${activeTab === 'VALIDAR'
                            ? 'bg-white/80 text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/60'
                            : 'text-gray-500/80 hover:bg-white/40 border border-transparent'
                            }`}
                    >
                        <Monitor size={18} />
                        Validar Online
                        {pagos.filter(p => p.canal !== 'PRESENCIAL').length > 0 && (
                            <span className="ml-2 py-0.5 px-2 rounded-full bg-orange-100/80 text-orange-700 text-xs border border-orange-200/50 shadow-sm">{pagos.filter(p => p.canal !== 'PRESENCIAL').length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORIAL')}
                        className={`py-2 px-5 inline-flex items-center gap-2 rounded-2xl font-bold text-sm transition-all ${activeTab === 'HISTORIAL'
                            ? 'bg-white/80 text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/60'
                            : 'text-gray-500/80 hover:bg-white/40 border border-transparent'
                            }`}
                    >
                        <FileText size={18} />
                        Historial
                    </button>
                </nav>
            </div>

            {/* TAB CONTENT: REGISTRAR */}
            {activeTab === 'REGISTRAR' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

                    {/* SECTION 1: SOLICITUDES DE CAJA (PRESENCIAL) */}
                    {pagos.filter(p => p.canal === 'PRESENCIAL').length > 0 && (
                        <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-purple-200/50 overflow-hidden">
                            <div className="p-5 bg-purple-50/50 border-b border-purple-100/50 flex items-center gap-2">
                                <Building className="text-purple-600 drop-shadow-sm" size={18} />
                                <h3 className="font-bold text-purple-900 tracking-tight">Solicitudes de Pago en Caja</h3>
                                <span className="ml-auto text-xs bg-purple-100/80 text-purple-800 px-3 py-1 rounded-full font-bold border border-purple-200/50 shadow-sm">
                                    {pagos.filter(p => p.canal === 'PRESENCIAL').length} Pendientes
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/30 text-xs font-bold text-gray-500/80 uppercase tracking-wider">
                                        <tr className="border-b border-purple-100/50">
                                            <th className="p-4">Fecha</th>
                                            <th className="p-4">Paciente</th>
                                            <th className="p-4">Referencia</th>
                                            <th className="p-4 text-right">Monto ($)</th>
                                            <th className="p-4 text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-purple-100/30">
                                        {pagos.filter(p => p.canal === 'PRESENCIAL').map((pago) => (
                                            <tr key={pago.pagoId} className="hover:bg-white/60 transition-colors">
                                                <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {new Date(pago.fecha).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900 text-sm">{pago.paciente}</div>
                                                    <div className="text-xs font-medium text-gray-500 mt-0.5">{pago.cedula}</div>
                                                </td>
                                                <td className="p-4 text-sm font-bold text-gray-600">{pago.referencia}</td>
                                                <td className="p-4 text-right font-black text-emerald-600 text-base">${pago.monto.toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            // Construct Invoice Object from Payment info if not found in list
                                                            const inv = pendingInvoices.find(i => i.facturaId === pago.facturaId) || {
                                                                facturaId: pago.facturaId,
                                                                numeroFactura: pago.numeroFactura || null,
                                                                fechaEmision: new Date().toISOString(), // Fallback
                                                                paciente: pago.paciente,
                                                                cedula: pago.cedula,
                                                                doctor: "---",
                                                                total: pago.monto,
                                                                saldoPendiente: pago.monto // Use payment amount as pending because we are completing it
                                                            };
                                                            handleOpenPayment(inv);
                                                        }}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-2xl transition-colors shadow-[0_8px_20px_rgba(147,51,234,0.3)] hover:shadow-[0_8px_20px_rgba(147,51,234,0.4)] backdrop-blur-md border border-purple-500/50"
                                                    >
                                                        <CheckCircle size={16} /> Completar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: TODAS LAS FACTURAS PENDIENTES */}
                    <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 overflow-hidden">
                        <div className="p-5 border-b border-white/40 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 tracking-tight">
                                <FileText size={18} className="text-lime-600 drop-shadow-sm" /> Pacientes por Cobrar
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/30 text-xs font-bold text-gray-500/80 uppercase tracking-wider">
                                    <tr className="border-b border-white/40">
                                        <th className="p-4">Emisión</th>
                                        <th className="p-4">Factura</th>
                                        <th className="p-4">Paciente</th>
                                        <th className="p-4">Doctor</th>
                                        <th className="p-4 text-right">Saldo Pendiente</th>
                                        <th className="p-4 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/30">
                                    {pendingInvoices.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-medium italic">No hay pacientes esperando pago.</td></tr>
                                    ) : (
                                        pendingInvoices.map((inv) => (
                                            <tr key={inv.facturaId} className="hover:bg-white/60 transition-colors group">
                                                <td className="p-4 text-sm font-medium text-gray-500">
                                                    {new Date(inv.fechaEmision).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-sm font-bold text-gray-600">
                                                    #{inv.numeroFactura || '---'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900 text-sm">{inv.paciente}</div>
                                                    <div className="text-xs font-medium text-gray-500 mt-0.5">{inv.cedula}</div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-gray-600">
                                                    {inv.doctor}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-black text-red-600 bg-red-50/80 px-3 py-1.5 rounded-xl border border-red-200/50 shadow-sm inline-block">
                                                        ${inv.saldoPendiente.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleOpenPayment(inv)}
                                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-lime-500/95 hover:bg-lime-500 text-white text-sm font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300"
                                                    >
                                                        <DollarSign size={16} /> Cobrar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: VALIDAR */}
            {activeTab === 'VALIDAR' && (
                <div className="space-y-6">
                    {/* Filters Bar for Validar */}
                    <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block pl-1">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Nombre, Cédula..."
                                    value={valSearchTerm}
                                    onChange={(e) => setValSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block pl-1">Fecha Registro</label>
                            <input
                                type="date"
                                value={valFilterRegisterDate}
                                onChange={(e) => setValFilterRegisterDate(e.target.value)}
                                className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block pl-1">Fecha Pago</label>
                            <input
                                type="date"
                                value={valFilterPaymentDate}
                                onChange={(e) => setValFilterPaymentDate(e.target.value)}
                                className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-600"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadData()}
                                className="px-6 py-3.5 bg-lime-500/95 hover:bg-lime-500 text-white font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 flex items-center gap-2 text-sm"
                            >
                                <Search size={16} /> Buscar
                            </button>
                            <button
                                onClick={() => {
                                    setValSearchTerm("");
                                    setValFilterRegisterDate("");
                                    setValFilterPaymentDate("");
                                    loadData(undefined, { search: "", dateRegister: "", datePayment: "" });
                                }}
                                className="px-6 py-3.5 bg-white/50 hover:bg-white/60 text-gray-700 font-bold rounded-2xl transition-all shadow-sm backdrop-blur-sm border border-white/60 outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/30 text-xs font-bold text-gray-500/80 uppercase tracking-wider">
                                    <tr className="border-b border-white/40">
                                        <th className="p-4 whitespace-nowrap">Fecha Reg.</th>
                                        <th className="p-4 whitespace-nowrap">Fecha Pago</th>
                                        <th className="p-4">Paciente</th>
                                        <th className="p-4">Método</th>
                                        <th className="p-4">Destino</th>
                                        <th className="p-4">Referencia</th>
                                        <th className="p-4 text-right whitespace-nowrap">Monto ($)</th>
                                        <th className="p-4 text-right whitespace-nowrap">Monto (Bs)</th>
                                        <th className="p-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/30">
                                    {pagos.filter(p => p.canal !== 'PRESENCIAL').length === 0 ? (
                                        <tr><td colSpan={9} className="p-8 text-center text-gray-400 font-medium italic">No hay pagos online por validar.</td></tr>
                                    ) : (
                                        pagos.filter(p => p.canal !== 'PRESENCIAL').map((pago) => (
                                            <tr key={pago.pagoId} className="hover:bg-white/60 transition-colors">
                                                <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {pago.fechaRegistro
                                                            ? new Date(pago.fechaRegistro).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })
                                                            : <span className="text-gray-400 italic">--</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-bold text-gray-600 whitespace-nowrap">
                                                    {new Date(pago.fecha).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })}
                                                </td>
                                                <td className="p-4 min-w-[220px]">
                                                    <div className="font-bold text-gray-900 text-sm">{pago.paciente}</div>
                                                    <div className="text-xs font-medium text-gray-500 mt-0.5">{pago.cedula}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold bg-white/50 text-gray-700 border border-white/60 rounded-xl px-2.5 py-1.5 shadow-sm">
                                                        {pago.metodo}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs font-bold text-gray-600">
                                                    {pago.bancoDepositado || "-"}
                                                </td>
                                                <td className="p-4 text-xs font-bold text-gray-500">
                                                    {pago.referencia || "-"}
                                                </td>
                                                <td className="p-4 text-right font-black text-emerald-600 whitespace-nowrap text-base">
                                                    ${pago.monto.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right font-bold text-gray-500 whitespace-nowrap text-sm">
                                                    Bs {pago.montoBs?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) || '0.00'}
                                                </td>
                                                <td className="p-4 flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleApprove(pago.pagoId)}
                                                        disabled={!!processingId}
                                                        className="p-2.5 bg-emerald-50/80 text-emerald-600 border border-emerald-200/50 hover:bg-emerald-100/80 hover:border-emerald-300 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                                                        title="Validar Pago"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(pago.pagoId)}
                                                        disabled={!!processingId}
                                                        className="p-2.5 bg-red-50/80 text-red-600 border border-red-200/50 hover:bg-red-100/80 hover:border-red-300 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                                                        title="Rechazar Pago"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: HISTORIAL */}
            {activeTab === 'HISTORIAL' && (
                <div className="space-y-6">
                    {/* Filters Bar */}
                    <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block pl-1">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Nombre, Cédula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block pl-1">Fecha Registro</label>
                            <input
                                type="date"
                                value={filterRegisterDate}
                                onChange={(e) => setFilterRegisterDate(e.target.value)}
                                className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block pl-1">Fecha Pago</label>
                            <input
                                type="date"
                                value={filterPaymentDate}
                                onChange={(e) => setFilterPaymentDate(e.target.value)}
                                className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-600"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadData()}
                                className="px-6 py-3.5 bg-lime-500/95 hover:bg-lime-500 text-white font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 flex items-center gap-2 text-sm"
                            >
                                <Search size={16} /> Buscar
                            </button>
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterRegisterDate("");
                                    setFilterPaymentDate("");
                                    loadData({ search: "", dateRegister: "", datePayment: "" }, undefined);
                                }}
                                className="px-6 py-3.5 bg-white/50 hover:bg-white/60 text-gray-700 font-bold rounded-2xl transition-all shadow-sm backdrop-blur-sm border border-white/60 outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/30 text-xs font-bold text-gray-500/80 uppercase tracking-wider">
                                    <tr className="border-b border-white/40">
                                        <th className="p-4">Fecha Reg.</th>
                                        <th className="p-4">Fecha Pago</th>
                                        <th className="p-4">Paciente</th>
                                        <th className="p-4">Método</th>
                                        <th className="p-4">Destino</th>
                                        <th className="p-4">Referencia</th>
                                        <th className="p-4 text-right">Monto ($)</th>
                                        <th className="p-4 text-right">Monto (Bs)</th>
                                        <th className="p-4 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/30">
                                    {historyPagos.length === 0 ? (
                                        <tr><td colSpan={9} className="p-8 text-center text-gray-400 font-medium italic">No hay historial reciente</td></tr>
                                    ) : (
                                        historyPagos.map((pago) => (
                                            <tr key={pago.pagoId} className="hover:bg-white/60 transition-colors">
                                                <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                                                    {pago.fechaRegistro
                                                        ? new Date(pago.fechaRegistro).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })
                                                        : <span className="text-gray-400 italic">--</span>}
                                                </td>
                                                <td className="p-4 text-sm font-bold text-gray-600">
                                                    {new Date(pago.fecha).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })}
                                                </td>
                                                <td className="p-4 min-w-[220px]">
                                                    <div className="font-bold text-gray-900 text-sm">{pago.paciente}</div>
                                                    <div className="text-xs font-medium text-gray-500 mt-0.5">{pago.cedula}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold bg-white/50 text-gray-700 border border-white/60 rounded-xl px-2.5 py-1.5 shadow-sm">
                                                        {pago.metodo}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs font-bold text-gray-600">
                                                    {pago.bancoDepositado || "-"}
                                                </td>
                                                <td className="p-4 text-xs font-bold text-gray-500">
                                                    {pago.referencia || "-"}
                                                </td>
                                                <td className="p-4 text-right font-black text-emerald-600 text-base min-w-[120px]">
                                                    ${pago.monto.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right font-bold text-gray-500 text-sm whitespace-nowrap">
                                                    Bs {pago.montoBs?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) || '0.00'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {pago.estado === 'VALIDADO' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-800 border border-emerald-200/50 shadow-sm">
                                                            <CheckCircle size={14} /> Validado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-800 border border-red-200/50 shadow-sm">
                                                            <XCircle size={14} /> Rechazado
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <ManualPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                invoice={selectedInvoice}
                existingPayment={selectedInvoice ? pagos.find(p => p.facturaId === selectedInvoice.facturaId && p.canal === 'PRESENCIAL') : undefined}
                onSuccess={() => {
                    loadData();
                    // Optional: Switch to Historial or Validar, but staying on Registrar allows multiple payments
                }}
            />

            <Toaster position="top-right" richColors />
        </div >
    );
}
