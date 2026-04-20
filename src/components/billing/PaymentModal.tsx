
"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Building, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string;
    totalAmount: number;
    onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, invoiceId, totalAmount, onSuccess }: PaymentModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Data
    const [banks, setBanks] = useState<any[]>([]);
    const [methods, setMethods] = useState<any[]>([]);

    // Form
    const [amount, setAmount] = useState(totalAmount.toString());
    const [amountBs, setAmountBs] = useState("");
    const [reference, setReference] = useState("");
    const [selectedMethodId, setSelectedMethodId] = useState("");
    const [selectedBankId, setSelectedBankId] = useState("");
    const [exchangeRate, setExchangeRate] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

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

                const transferMethod = methodsData.find((m: any) => m.nombre === 'TRANSFERENCIA');
                if (transferMethod) setSelectedMethodId(transferMethod.id);

                if (configData.tasa && totalAmount) {
                    setAmountBs((totalAmount * configData.tasa).toFixed(2));
                }
            });
        }
    }, [isOpen]);

    // Effect 2: Initialize Form (Reset)
    useEffect(() => {
        if (isOpen) {
            setAmount(totalAmount.toString());
            setReference("");
            setSelectedBankId("");
            if (exchangeRate > 0) {
                setAmountBs((totalAmount * exchangeRate).toFixed(2));
            }
            setPaymentDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, totalAmount, exchangeRate]);

    // Bidirectional Handlers
    const handleAmountChange = (val: string) => {
        let newAmount = val;

        if (parseFloat(newAmount) > totalAmount) {
            newAmount = totalAmount.toString();
            toast.info("El monto no puede exceder la deuda pendiente");
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

        if (exchangeRate > 0 && newBs) {
            const numBs = parseFloat(newBs);
            const calculatedUsd = numBs / exchangeRate;

            if (calculatedUsd > totalAmount) {
                const maxBs = totalAmount * exchangeRate;
                newBs = maxBs.toFixed(2);
                toast.info("El monto no puede exceder la deuda pendiente");
                setAmount(totalAmount.toString());
            } else {
                setAmount(calculatedUsd.toFixed(2));
            }
        } else {
            setAmount("");
        }

        setAmountBs(newBs);
    };

    const handleSubmit = async () => {
        setFormError(null);
        if (!selectedMethodId) {
            setFormError("Selecciona un método de pago para continuar.");
            return;
        }
        if (!selectedBankId) {
            setFormError("Debes seleccionar una cuenta bancaria destino.");
            return;
        }
        if (!reference) {
            setFormError("Ingresa el número de referencia del comprobante bancario.");
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            setFormError("El monto a pagar debe ser mayor a cero.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                facturaId: invoiceId,
                monto: parseFloat(amount),
                metodoPagoId: selectedMethodId,
                referencia: reference,
                cuentaDestinoId: selectedBankId,
                canalPago: 'ONLINE',
                fechaPago: paymentDate ? `${paymentDate}T12:00:00` : undefined,
                usuarioId: user?.id || 1
            };

            const res = await fetch("/api/billing/payments/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Transferencia registrada. El personal de caja validará tu pago.");
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                console.error("Payment Error:", err);
                toast.error(err.error || "Error al registrar pago");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
        setLoading(false);
    };

    const handleReferenceChange = (val: string) => {
        const numericVal = val.replace(/[^0-9]/g, '');
        setReference(numericVal);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Transferencia">
            <div className="space-y-6">

                {/* Inline Form Error Banner */}
                {formError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 animate-in fade-in slide-in-from-top-2 duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="text-sm font-bold leading-snug">{formError}</p>
                    </div>
                )}

                {/* Amount Input Split */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto ($)</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => handleAmountChange(e.target.value)}
                                className="w-full pl-8 p-3 text-xl font-bold rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto (Bs)</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Bs</span>
                            <input
                                type="number"
                                value={amountBs}
                                onChange={e => handleAmountBsChange(e.target.value)}
                                className="w-full pl-10 p-3 text-xl font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-xs text-right text-gray-500 mt-1">Tasa: {exchangeRate} Bs/$</p>
                    </div>
                </div>

                {/* Date Input */}
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Pago</label>
                    <input
                        type="date"
                        value={paymentDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setPaymentDate(e.target.value)}
                        className="w-full mt-1 p-3 text-sm font-medium rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                </div>

                {/* Bank Accounts Selection */}
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-zinc-700 bg-gray-100/50 dark:bg-zinc-900/50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Building size={16} /> Cuentas Disponibles
                        </h3>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Selecciona una cuenta
                        </span>
                    </div>
                    <div className="p-2 space-y-2 max-h-48 overflow-y-auto">
                        {banks.map(b => (
                            <button
                                key={b.cuentaId}
                                onClick={() => setSelectedBankId(b.cuentaId.toString())}
                                className={`w-full text-left relative p-3 rounded-lg border transition-all
                                    ${selectedBankId === b.cuentaId.toString()
                                        ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500 z-10'
                                        : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{b.banco}</span>
                                    {selectedBankId === b.cuentaId.toString() && (
                                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            SELECCIONADA
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono text-xs mb-1">
                                    {b.numeroCuenta}
                                    <div onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(b.numeroCuenta);
                                        toast.success("Copiado");
                                    }} className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded cursor-pointer" title="Copiar">
                                        <Copy size={12} />
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                    Titular: {b.titular} • {b.rifTitular}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reference */}
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Referencia / Comprobante</label>
                    <input
                        value={reference}
                        onChange={e => handleReferenceChange(e.target.value)}
                        className="w-full mt-1 p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        placeholder="Solo números"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !selectedMethodId}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? "Procesando..." : "Registrar Transferencia"}
                </button>
            </div>
        </Modal>
    );
}
