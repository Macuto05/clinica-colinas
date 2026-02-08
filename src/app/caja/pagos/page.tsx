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
                <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl flex justify-between items-center border border-gray-200 dark:border-zinc-700">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Total a Pagar</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">${invoice.saldoPendiente.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Paciente</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.paciente}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-zinc-900 rounded-lg">
                    {[
                        { id: 'TRANSFERENCIA', icon: <Building size={16} />, label: 'Transferencia' },
                        { id: 'EFECTIVO', icon: <Banknote size={16} />, label: 'Efectivo $' },
                        { id: 'PUNTO', icon: <CreditCard size={16} />, label: 'Punto Venta' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all
                                ${activeTab === tab.id
                                    ? 'bg-white dark:bg-zinc-800 text-primary-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Monto ($)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => handleAmountChange(e.target.value)}
                            className="w-full mt-1 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-lg font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Monto (Bs)</label>
                        <input
                            type="number"
                            value={amountBs}
                            onChange={e => handleAmountBsChange(e.target.value)}
                            className="w-full mt-1 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-lg font-bold"
                            placeholder="0.00"
                        />
                        <div className="mt-1 flex justify-end">
                            <span className="text-xs opacity-50">Tasa: {exchangeRate}</span>
                        </div>
                    </div>
                </div>

                {/* Conditional Fields */}
                {(activeTab === 'TRANSFERENCIA' || activeTab === 'PUNTO') && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                {activeTab === 'PUNTO' ? 'Cuenta Destino (Punto Asociado)' : 'Cuenta Destino'}
                            </label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2">
                                {banks.map(b => (
                                    <button
                                        key={b.cuentaId}
                                        onClick={() => setSelectedBankId(b.cuentaId.toString())}
                                        className={`text-left p-3 rounded-lg border transition-all text-sm
                                            ${selectedBankId === b.cuentaId.toString()
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                                : 'border-gray-200 dark:border-zinc-700 hover:border-blue-400'}`}
                                    >
                                        <div className="font-bold text-gray-900 dark:text-white">{b.banco}</div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span className="font-mono">{b.numeroCuenta}</span>
                                            <span>{b.titular}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {activeTab === 'PUNTO' ? 'Nro. Referencia' : 'Nro. Referencia'}
                            </label>
                            <input
                                value={reference}
                                onChange={e => setReference(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full mt-1 p-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                placeholder={activeTab === 'PUNTO' ? "Solo números" : "Solo números"}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'EFECTIVO' && (
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl text-orange-800 dark:text-orange-400 text-sm flex items-start gap-3">
                        <Wallet className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="font-bold">Pago en Efectivo</p>
                            <p className="opacity-80">Asegúrate de recibir el dinero completo antes de registrar. Si hay cambio pendiente, regístralo en las notas si es necesario.</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3.5 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Caja</h1>
                    <p className="text-gray-500 dark:text-gray-400">Registra cobros y valida transferencias</p>
                </div>

            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 dark:border-zinc-800">
                <nav className="flex gap-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('REGISTRAR')}
                        className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'REGISTRAR'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <HandCoins size={18} />
                        Registrar Cobro
                        {/* Show count of Presencial Requests + Pending Invoices if needed, or just Presencial */}
                        {pagos.filter(p => p.canal === 'PRESENCIAL').length > 0 && (
                            <span className="ml-2 py-0.5 px-2 rounded-full bg-purple-100 text-purple-600 text-xs animate-pulse">
                                {pagos.filter(p => p.canal === 'PRESENCIAL').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('VALIDAR')}
                        className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'VALIDAR'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Monitor size={18} />
                        Validar Online
                        {pagos.filter(p => p.canal !== 'PRESENCIAL').length > 0 && (
                            <span className="ml-2 py-0.5 px-2 rounded-full bg-orange-100 text-orange-600 text-xs">{pagos.filter(p => p.canal !== 'PRESENCIAL').length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORIAL')}
                        className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'HISTORIAL'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-purple-200 dark:border-purple-900/50 overflow-hidden">
                            <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800/50 flex items-center gap-2">
                                <Building className="text-purple-600" size={18} />
                                <h3 className="font-bold text-purple-900 dark:text-purple-300">Solicitudes de Pago en Caja</h3>
                                <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                    {pagos.filter(p => p.canal === 'PRESENCIAL').length} Pendientes
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-zinc-800">
                                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Referencia</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Monto ($)</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                        {pagos.filter(p => p.canal === 'PRESENCIAL').map((pago) => (
                                            <tr key={pago.pagoId} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {new Date(pago.fecha).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{pago.paciente}</div>
                                                    <div className="text-xs text-gray-500">{pago.cedula}</div>
                                                </td>
                                                <td className="p-4 text-sm font-mono text-gray-500">{pago.referencia}</td>
                                                <td className="p-4 text-right font-bold text-emerald-600">${pago.monto.toFixed(2)}</td>
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
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm hover:shadow"
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
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <FileText size={18} className="text-gray-500" /> Pacientes por Cobrar
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Emisión</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Factura</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Saldo Pendiente</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {pendingInvoices.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay pacientes esperando pago.</td></tr>
                                    ) : (
                                        pendingInvoices.map((inv) => (
                                            <tr key={inv.facturaId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="p-4 text-sm text-gray-500">
                                                    {new Date(inv.fechaEmision).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                                                    #{inv.numeroFactura || '---'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{inv.paciente}</div>
                                                    <div className="text-xs text-gray-500">{inv.cedula}</div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {inv.doctor}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-gray-900 dark:text-white bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                                                        ${inv.saldoPendiente.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleOpenPayment(inv)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow"
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
                <div className="space-y-4">
                    {/* Filters Bar for Validar */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Nombre, Cédula..."
                                    value={valSearchTerm}
                                    onChange={(e) => setValSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fecha Registro</label>
                            <input
                                type="date"
                                value={valFilterRegisterDate}
                                onChange={(e) => setValFilterRegisterDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fecha Pago</label>
                            <input
                                type="date"
                                value={valFilterPaymentDate}
                                onChange={(e) => setValFilterPaymentDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadData()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-zinc-800 bg-orange-50/10">
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Fecha Reg.</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Fecha Pago</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                        {/* Canal Removed */}
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Método</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Destino</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Referencia</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right whitespace-nowrap">Monto ($)</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right whitespace-nowrap">Monto (Bs)</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {pagos.filter(p => p.canal !== 'PRESENCIAL').length === 0 ? (
                                        <tr><td colSpan={9} className="p-8 text-center text-gray-500">No hay pagos online por validar.</td></tr>
                                    ) : (
                                        pagos.filter(p => p.canal !== 'PRESENCIAL').map((pago) => (
                                            <tr key={pago.pagoId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                {/* Fecha REGISTRO (System) */}
                                                {/* Fecha REGISTRO (System) */}
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {pago.fechaRegistro
                                                            ? new Date(pago.fechaRegistro).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })
                                                            : <span className="text-gray-400 italic">--</span>}
                                                    </div>
                                                </td>

                                                {/* Fecha PAGO (User) */}
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                    <div className="font-medium">
                                                        {new Date(pago.fecha).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })}
                                                    </div>
                                                </td>

                                                <td className="p-4 min-w-[220px]">
                                                    <div className="font-medium text-gray-900 dark:text-white">{pago.paciente}</div>
                                                    <div className="text-xs text-gray-500">{pago.cedula}</div>
                                                </td>

                                                {/* Canal Removed */}

                                                <td className="p-4">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {pago.metodo}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {pago.bancoDepositado || "-"}
                                                </td>
                                                <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                                                    {pago.referencia || "-"}
                                                </td>
                                                <td className="p-4 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    ${pago.monto.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                                                    Bs {pago.montoBs?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) || '0.00'}
                                                </td>
                                                <td className="p-4 flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleApprove(pago.pagoId)}
                                                        disabled={!!processingId}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Validar Pago"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(pago.pagoId)}
                                                        disabled={!!processingId}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
                <div className="space-y-4">
                    {/* Filters Bar */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Nombre, Cédula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fecha Registro</label>
                            <input
                                type="date"
                                value={filterRegisterDate}
                                onChange={(e) => setFilterRegisterDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fecha Pago</label>
                            <input
                                type="date"
                                value={filterPaymentDate}
                                onChange={(e) => setFilterPaymentDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadData()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Fecha Reg.</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Fecha Pago</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Método</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Destino</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Referencia</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Monto ($)</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Monto (Bs)</th>
                                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {historyPagos.length === 0 ? (
                                        <tr><td colSpan={9} className="p-8 text-center text-gray-400 italic">No hay historial reciente</td></tr>
                                    ) : (
                                        historyPagos.map((pago) => (
                                            <tr key={pago.pagoId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                    {pago.fechaRegistro
                                                        ? new Date(pago.fechaRegistro).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })
                                                        : <span className="text-gray-400 italic">--</span>}
                                                </td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                    <div className="font-medium">
                                                        {new Date(pago.fecha).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{pago.paciente}</div>
                                                    <div className="text-xs text-gray-500">{pago.cedula}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {pago.metodo}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {pago.bancoDepositado || "-"}
                                                </td>
                                                <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                                                    {pago.referencia || "-"}
                                                </td>
                                                <td className="p-4 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap min-w-[120px]">
                                                    ${pago.monto.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                                                    Bs {pago.montoBs?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) || '0.00'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {pago.estado === 'VALIDADO' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            <CheckCircle size={12} /> Validado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                            <XCircle size={12} /> Rechazado
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
