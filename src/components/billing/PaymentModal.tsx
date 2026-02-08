
"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Building, CreditCard, Banknote, User, Smartphone, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string;
    totalAmount: number; // Monto de la factura o deuda total
    onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, invoiceId, totalAmount, onSuccess }: PaymentModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'DIGITAL' | 'PRESENCIAL'>('DIGITAL');
    const [loading, setLoading] = useState(false);

    // Data
    const [banks, setBanks] = useState<any[]>([]);
    const [methods, setMethods] = useState<any[]>([]);

    // Form
    const [amount, setAmount] = useState(totalAmount.toString());
    const [amountBs, setAmountBs] = useState(""); // State for Bs
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

                // Init Bs if amount exists
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
            // Bs update handled by rate loading or manual trigger, but let's sync here too if rate known
            if (exchangeRate > 0) {
                setAmountBs((totalAmount * exchangeRate).toFixed(2));
            }
            setPaymentDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, totalAmount, exchangeRate]);

    // Bidirectional Handlers
    const handleAmountChange = (val: string) => {
        let newAmount = val;

        // Validation: Prevent exceeding total debt
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

        // First calculate tentative USD to check limit
        if (exchangeRate > 0 && newBs) {
            const numBs = parseFloat(newBs);
            const calculatedUsd = numBs / exchangeRate;

            if (calculatedUsd > totalAmount) {
                // Clamp to max allowed Bs
                const maxBs = totalAmount * exchangeRate;
                newBs = maxBs.toFixed(2);
                toast.info("El monto no puede exceder la deuda pendiente");

                // Update USD to max
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
        if (!selectedMethodId && activeTab === 'DIGITAL') {
            toast.error("Selecciona un método de pago");
            return;
        }
        if (activeTab === 'DIGITAL' && !selectedBankId) {
            toast.error("Selecciona la cuenta destino");
            return;
        }
        if (activeTab === 'DIGITAL' && !reference) {
            toast.error("Ingresa la referencia bancaria");
            return;
        }

        setLoading(true);
        try {
            let finalMethodId = selectedMethodId;
            // Si es presencial y no hay método seleccionado, usamos Efectivo o cualquiera disponible como fallback
            if (activeTab === 'PRESENCIAL' && !finalMethodId) {
                const defaultMethod = methods.find((m: any) => m.nombre === 'EFECTIVO' || m.nombre === 'PUNTO');
                if (defaultMethod) finalMethodId = defaultMethod.id;
            }

            const payload = {
                facturaId: invoiceId,
                monto: parseFloat(amount),
                metodoPagoId: finalMethodId,
                referencia: reference || "PRESENCIAL",
                cuentaDestinoId: selectedBankId, // Passed to API
                canalPago: activeTab === 'PRESENCIAL' ? 'PRESENCIAL' : 'ONLINE',
                fechaPago: paymentDate ? `${paymentDate}T12:00:00` : undefined, // Force Noon UTC
                usuarioId: user?.id || 1
            };

            const res = await fetch("/api/billing/payments/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Pago registrado correctamente");
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
        // Enforce Numbers Only
        const numericVal = val.replace(/[^0-9]/g, '');
        setReference(numericVal);
    };

    const digitalMethods = methods.filter(m => m.nombre === 'TRANSFERENCIA');
    const presencialMethods = methods.filter(m => ['EFECTIVO', 'PUNTO'].includes(m.nombre));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago">
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-zinc-700">
                <button
                    onClick={() => setActiveTab('DIGITAL')}
                    className={`pb-2 px-4 text-sm font-medium transition-colors ${activeTab === 'DIGITAL' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
                >
                    Transferencia / Digital
                </button>
                <button
                    onClick={() => setActiveTab('PRESENCIAL')}
                    className={`pb-2 px-4 text-sm font-medium transition-colors ${activeTab === 'PRESENCIAL' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
                >
                    Presencial (Caja)
                </button>
            </div>

            <div className="space-y-6">

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

                {activeTab === 'DIGITAL' ? (
                    <>
                        {/* Date Input - Only for Digital */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Pago</label>
                            <input
                                type="date"
                                value={paymentDate}
                                max={new Date().toISOString().split('T')[0]} // 1. Prevent future dates
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full mt-1 p-3 text-sm font-medium rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                            />
                        </div>

                        {/* Bank Accounts Selection */}
                        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden mt-4">
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

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Referencia / Comprobante</label>
                            <input
                                value={reference}
                                onChange={e => handleReferenceChange(e.target.value)}
                                className="w-full mt-1 p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                placeholder="Solo números"
                            />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-6 rounded-2xl mb-6 border border-blue-100 dark:border-blue-800/50">
                            <div className="bg-blue-100 dark:bg-blue-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-200">
                                <Building size={24} />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Pago en Taquilla</h3>
                            <p className="text-sm opacity-90 leading-relaxed max-w-md mx-auto">
                                Acércate a la caja para realizar tu pago. Podrás decidir el método de pago (Efectivo, Punto o Transferencia) directamente con el cajero.
                            </p>
                        </div>

                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            Al notificar tu intención, el cajero tendrá tus datos listos para agilizar el proceso.
                        </p>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading || (activeTab === 'DIGITAL' && !selectedMethodId)}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? "Procesando..." : (activeTab === 'DIGITAL' ? "Registrar Pago" : "Notificar Intención")}
                </button>
            </div>
        </Modal>
    );
}
