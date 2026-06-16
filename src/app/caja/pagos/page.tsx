"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Search, Calendar, CreditCard, User, FileText, DollarSign, Wallet, Building, Monitor, HandCoins, Banknote, PlusCircle } from "lucide-react";
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
    citaId?: string; // Added to help find emergency if needed
}

interface FacturaDetalle {
    detalleId?: string;
    tipoItem: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    importe: number;
    referenciaId?: string | null;
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
    esEmergencia: boolean;
    estadoFactura: string;
    cartaAvalAprobada?: boolean;
    codigoAval?: string | null;
    limiteCobertura?: number;
}

// --- Payment Modal Component ---

interface ManualPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: PendingInvoice | null;
    onSuccess: () => void;
}

function ManualPaymentModal({ isOpen, onClose, invoice, onSuccess }: ManualPaymentModalProps) {
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
            setAmount(invoice.saldoPendiente.toString());
            setReference("");
            setSelectedBankId("");
            if (tasa > 0) setAmountBs((invoice.saldoPendiente * tasa).toFixed(2));
        }
    }, [isOpen, invoice, exchangeRate]);

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
            // Always create a new PRESENCIAL payment — validated immediately by the API
            const payload = {
                facturaId: invoice.facturaId,
                monto: parseFloat(amount),
                metodoPagoId: methodId,
                referencia: finalReference,
                cuentaDestinoId: (activeTab === 'TRANSFERENCIA' || activeTab === 'PUNTO') ? selectedBankId : null,
                canalPago: "PRESENCIAL",
                usuarioId: user?.id || 1
            };

            const res = await fetch("/api/billing/payments/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Cobro registrado correctamente");
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

// --- Review/Edit Invoice Modal ---

interface ReviewInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    facturaId: string | null;
    onSuccess: () => void;
    isApproved?: boolean;
}

function ReviewInvoiceModal({ isOpen, onClose, facturaId, onSuccess, isApproved = false }: ReviewInvoiceModalProps) {
    const [factura, setFactura] = useState<any>(null);
    const [detalles, setDetalles] = useState<FacturaDetalle[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form logic
    useEffect(() => {
        if (isOpen && facturaId) {
            setLoading(true);
            fetch(`/api/billing/invoices/${facturaId}`)
                .then(r => r.json())
                .then(data => {
                    setFactura(data);
                    setDetalles(data.detalles || []);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, facturaId]);

    const handleRemoveItem = (index: number) => {
        setDetalles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddItem = () => {
        const newItem: FacturaDetalle = {
            tipoItem: "SERVICIO",
            descripcion: "Nuevo Concepto",
            cantidad: 1,
            precioUnitario: 0,
            importe: 0
        };
        setDetalles(prev => [...prev, newItem]);
    };

    const handleUpdateItem = (index: number, field: string, val: any) => {
        setDetalles(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const updated = { ...item, [field]: val };
            // Auto recalc amount
            if (field === 'cantidad' || field === 'precioUnitario') {
                updated.importe = Number(updated.cantidad) * Number(updated.precioUnitario);
            }
            return updated;
        }));
    };

    const handleSave = async () => {
        if (!facturaId) return;
        setSaving(true);
        
        const total = detalles.reduce((sum, d) => sum + Number(d.importe), 0);
        
        try {
            const res = await fetch(`/api/billing/invoices/${facturaId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    detalles,
                    subtotal: total,
                    total: total,
                    saldoPendiente: total // Resetting balance to new total for simplicity
                })
            });

            if (res.ok) {
                toast.success("Factura actualizada correctamente");
                onSuccess();
                onClose();
            } else {
                toast.error("Error al guardar cambios");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    // Validar que no haya campos vacíos
    const hasEmptyFields = detalles.some(d =>
        !d.descripcion?.trim() || d.cantidad === undefined || d.cantidad === '' || d.precioUnitario === undefined || d.precioUnitario === ''
    );

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Revisión de Cargos y Factura" className="max-w-5xl">
            <div className="space-y-4" style={{ contain: "layout style paint" }}>
                {loading ? (
                    <div className="flex justify-center py-10"><Monitor className="animate-spin text-lime-600" /></div>
                ) : (
                    <>
                        <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Paciente</p>
                                    <p className="text-sm font-bold text-gray-800">{factura?.cita?.paciente?.nombres} {factura?.cita?.paciente?.apellidos}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">ID Caso</p>
                                    <p className="text-sm font-mono font-bold text-gray-600">#{facturaId}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Desglose de Conceptos {isApproved && <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded ml-2 border border-amber-200">(Vista)</span>}</h4>
                                {!isApproved && (
                                    <button onClick={handleAddItem} className="flex items-center gap-1.5 text-[11px] font-black uppercase text-lime-600 bg-lime-50 px-3 py-1 rounded-full border border-lime-200">
                                        <PlusCircle size={14} /> Añadir Item
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                {detalles.map((d, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${isApproved ? 'bg-white/40 border border-white/60' : 'bg-white/60 border border-white/80 hover:bg-white/70'}`}>
                                        <div className="flex-1">
                                            <input
                                                value={d.descripcion}
                                                onChange={e => !isApproved && handleUpdateItem(i, 'descripcion', e.target.value)}
                                                placeholder="Nombre del cargo..."
                                                disabled={isApproved}
                                                className={`w-full text-xs font-bold bg-transparent border-none outline-none ${isApproved ? 'text-gray-600 cursor-default' : 'focus:text-lime-700'}`}
                                            />
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Cant:</span>
                                                    <input
                                                        type="number"
                                                        value={d.cantidad === 0 || d.cantidad === undefined ? '' : d.cantidad}
                                                        onChange={e => !isApproved && handleUpdateItem(i, 'cantidad', parseFloat(e.target.value) || '')}
                                                        placeholder="1"
                                                        disabled={isApproved}
                                                        className={`w-12 text-xs font-black rounded-lg px-2 py-1 border ${isApproved ? 'bg-white/30 border-white/50 cursor-default text-gray-600' : 'bg-white/50 border-white/80'}`}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Precio $:</span>
                                                    <input
                                                        type="number"
                                                        value={d.precioUnitario === 0 || d.precioUnitario === undefined ? '' : d.precioUnitario}
                                                        onChange={e => !isApproved && handleUpdateItem(i, 'precioUnitario', parseFloat(e.target.value) || '')}
                                                        placeholder="0.00"
                                                        disabled={isApproved}
                                                        className={`w-20 text-xs font-black rounded-lg px-2 py-1 border ${isApproved ? 'bg-white/30 border-white/50 cursor-default text-gray-600' : 'bg-white/50 border-white/80 text-emerald-700'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-black text-gray-900">${Number(d.importe).toFixed(2)}</p>
                                            {!isApproved && (
                                                <button onClick={() => handleRemoveItem(i)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-white/40 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Total {isApproved && '(Aprobado)'}</p>
                                <p className="text-2xl font-black text-gray-900 tracking-tight">
                                    ${detalles.reduce((a, b) => a + Number(b.importe || 0), 0).toFixed(2)}
                                </p>
                            </div>
                            {!isApproved && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving || hasEmptyFields}
                                    title={hasEmptyFields ? "Completa todos los campos (nombre, cantidad, precio)" : ""}
                                    className="px-8 py-3.5 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? "Guardando..." : "Finalizar Auditoría"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

// --- Main Page Component ---

export default function PagosPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'REGISTRAR' | 'VALIDAR' | 'HISTORIAL'>('REGISTRAR');

    // Data State
    const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
    const [pagos, setPagos] = useState<PendingPayment[]>([]);
    const [historyPagos, setHistoryPagos] = useState<PendingPayment[]>([]);

    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoice | null>(null);

    // Review Modal State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewFacturaId, setReviewFacturaId] = useState<string | null>(null);
    const [isReviewApproved, setIsReviewApproved] = useState(false);

    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRegisterDate, setFilterRegisterDate] = useState("");
    const [filterPaymentDate, setFilterPaymentDate] = useState("");

    // Registrar Cobro Filters State
    const [regSearchTerm, setRegSearchTerm] = useState("");
    const [regFilterTipo, setRegFilterTipo] = useState<'TODOS' | 'EMERGENCIA' | 'CONSULTA'>('TODOS');
    const [regFilterEstado, setRegFilterEstado] = useState<'TODOS' | 'EN_REVISION' | 'PENDIENTE' | 'PARCIAL'>('TODOS');

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

    const handlePagoSeguro = async (inv: PendingInvoice) => {
        const cobertura = inv.limiteCobertura ?? 0;
        const pagarMonto = Math.min(cobertura, inv.saldoPendiente);
        const restante = Math.max(0, inv.saldoPendiente - pagarMonto);
        const msg = restante > 0
            ? `¿Aplicar cobertura del seguro? Se cubrirá $${pagarMonto.toFixed(2)} de $${inv.saldoPendiente.toFixed(2)}. El saldo restante de $${restante.toFixed(2)} quedará a cargo del paciente.`
            : `¿Aplicar cobertura del seguro? El seguro cubre el total de $${inv.saldoPendiente.toFixed(2)}. La factura quedará pagada en su totalidad.`;
        if (!confirm(msg)) return;
        setProcessingId(inv.facturaId);
        try {
            const res = await fetch(`/api/billing/invoices/${inv.facturaId}/seguro-pago`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Pago por seguro aplicado");
                loadData();
            } else {
                toast.error(data.error || "Error al procesar pago por seguro");
            }
        } catch { toast.error("Error de conexión"); }
        setProcessingId(null);
    };

    const handleAprobarFactura = async (facturaId: string) => {
        setProcessingId(facturaId);
        try {
            const res = await fetch(`/api/billing/invoices/${facturaId}/aprobar`, { method: "POST" });
            if (res.ok) {
                toast.success("Factura aprobada — ya visible para el paciente");
                loadData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Error al aprobar factura");
            }
        } catch { toast.error("Error de conexión"); }
        setProcessingId(null);
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

                    {/* PACIENTES POR COBRAR — todas las facturas no pagadas */}
                    <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 overflow-hidden">
                        <div className="p-5 border-b border-white/40 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 tracking-tight">
                                <FileText size={18} className="text-lime-600 drop-shadow-sm" /> Pacientes por Cobrar
                            </h3>
                        </div>

                        {/* Filtros */}
                        <div className="px-5 py-4 border-b border-white/30 bg-white/20 flex flex-wrap gap-3 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-1.5 block">Buscar</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Nombre, Cédula..."
                                        value={regSearchTerm}
                                        onChange={e => setRegSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-white/60 bg-white/70 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-300 shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-1.5 block">Tipo</label>
                                <select
                                    value={regFilterTipo}
                                    onChange={e => setRegFilterTipo(e.target.value as any)}
                                    className="px-3 py-2 rounded-xl border border-white/60 bg-white/70 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-300 shadow-sm"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="EMERGENCIA">Emergencia</option>
                                    <option value="CONSULTA">Consulta</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-1.5 block">Estado</label>
                                <select
                                    value={regFilterEstado}
                                    onChange={e => setRegFilterEstado(e.target.value as any)}
                                    className="px-3 py-2 rounded-xl border border-white/60 bg-white/70 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-300 shadow-sm"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="EN_REVISION">En Revisión</option>
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="PARCIAL">Parcial</option>
                                </select>
                            </div>
                            {(regSearchTerm || regFilterTipo !== 'TODOS' || regFilterEstado !== 'TODOS') && (
                                <button
                                    onClick={() => { setRegSearchTerm(""); setRegFilterTipo('TODOS'); setRegFilterEstado('TODOS'); }}
                                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white/60 hover:bg-white rounded-xl border border-white/60 transition-all shadow-sm"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            {(() => {
                                const filtered = pendingInvoices.filter(inv => {
                                    const matchSearch = !regSearchTerm ||
                                        inv.paciente.toLowerCase().includes(regSearchTerm.toLowerCase()) ||
                                        inv.cedula.toLowerCase().includes(regSearchTerm.toLowerCase());
                                    const matchTipo = regFilterTipo === 'TODOS' ||
                                        (regFilterTipo === 'EMERGENCIA' && inv.esEmergencia) ||
                                        (regFilterTipo === 'CONSULTA' && !inv.esEmergencia);
                                    const matchEstado = regFilterEstado === 'TODOS' || inv.estadoFactura === regFilterEstado;
                                    return matchSearch && matchTipo && matchEstado;
                                });
                            return (
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
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-medium italic">No hay pacientes esperando pago.</td></tr>
                                    ) : (
                                        pendingInvoices.map((inv) => (
                                            <tr key={inv.facturaId} className="hover:bg-white/60 transition-colors group">
                                                <td className="p-4 text-sm font-medium text-gray-500">
                                                    {new Date(inv.fechaEmision).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-bold text-gray-600">#{inv.numeroFactura || '---'}</div>
                                                    {inv.estadoFactura === 'EN_REVISION' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1">
                                                            En Revisión
                                                        </span>
                                                    )}
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
                                                    <div className="flex items-center justify-center gap-2">
                                                        {inv.esEmergencia && (
                                                            <button
                                                                onClick={() => {
                                                                    setReviewFacturaId(inv.facturaId);
                                                                    setIsReviewApproved(inv.estadoFactura !== 'EN_REVISION');
                                                                    setIsReviewModalOpen(true);
                                                                }}
                                                                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-2xl transition-all border ${
                                                                    inv.estadoFactura === 'EN_REVISION'
                                                                        ? 'bg-white/60 hover:bg-white text-gray-600 border-white/80 shadow-sm'
                                                                        : 'bg-white/50 text-gray-500 border-white/60'
                                                                }`}
                                                            >
                                                                Revisar
                                                            </button>
                                                        )}
                                                        {inv.estadoFactura === 'EN_REVISION' ? (
                                                            <button
                                                                onClick={() => handleAprobarFactura(inv.facturaId)}
                                                                disabled={processingId === inv.facturaId}
                                                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500/95 hover:bg-amber-500 text-white text-sm font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(245,158,11,0.3)] border border-amber-400/50 disabled:opacity-50"
                                                            >
                                                                <CheckCircle size={16} /> Aprobar
                                                            </button>
                                                        ) : (
                                                            <>
                                                                {inv.esEmergencia && inv.cartaAvalAprobada && (
                                                                    <button
                                                                        onClick={() => handlePagoSeguro(inv)}
                                                                        disabled={processingId === inv.facturaId}
                                                                        title={`Carta Aval aprobada — Cobertura: $${(inv.limiteCobertura ?? 0).toFixed(2)}`}
                                                                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-500/95 hover:bg-blue-500 text-white text-sm font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(59,130,246,0.3)] border border-blue-400/50 disabled:opacity-50"
                                                                    >
                                                                        <CheckCircle size={15} /> Seguro
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleOpenPayment(inv)}
                                                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-lime-500/95 hover:bg-lime-500 text-white text-sm font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300"
                                                                >
                                                                    <DollarSign size={16} /> Cobrar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            );
                            })()}
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
                onSuccess={() => {
                    loadData();
                }}
            />

            <ReviewInvoiceModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                facturaId={reviewFacturaId}
                onSuccess={() => loadData()}
                isApproved={isReviewApproved}
            />

            <Toaster position="top-right" richColors />
        </div>
    );
}
