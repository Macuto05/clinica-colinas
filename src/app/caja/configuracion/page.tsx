
"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Building, CreditCard, Banknote, Pencil, X } from "lucide-react";
import { Toaster, toast } from "sonner";

interface BankAccount {
    cuentaId: number;
    banco: string;
    numeroCuenta: string;
    titular: string;
    rifTitular: string;
    tipo: string;
    activa: boolean;
}

export default function CajaConfigPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Banknote className="text-lime-600" />
                        Configuración Financiera
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Administra precios base y cuentas bancarias receptoras.</p>
                </div>
            </div>

            <ConsultationPriceCard />
            <BankAccountsCard />
            <Toaster position="top-right" richColors />
        </div>
    );
}

function ConsultationPriceCard() {
    const [price, setPrice] = useState<string>("50.00");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/billing/config")
            .then(res => res.json())
            .then(data => {
                if (data.precioConsulta) setPrice(data.precioConsulta.toString());
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/billing/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ precioConsulta: parseFloat(price) })
            });
            if (res.ok) {
                toast.success("Precio actualizado correctamente");
            } else {
                toast.error("Error al guardar precio");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
        setSaving(false);
    };

    return (
        <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.04)] border border-white/60 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-lime-100/80 rounded-2xl border border-lime-200/50 shadow-sm">
                    <Banknote className="w-6 h-6 text-lime-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Precio Consulta Base</h2>
            </div>

            <div className="flex items-end gap-4 max-w-md">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider pl-1 mb-1.5">
                        Monto en USD ($)
                    </label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none transition-all font-mono text-xl font-bold shadow-inner placeholder:text-gray-400"
                        placeholder="0.00"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-8 py-3.5 bg-lime-50 text-lime-700 rounded-2xl font-bold transition-all shadow-[0_4px_12px_rgba(132,204,22,0.2)] border border-lime-500/80 ring-2 ring-lime-400/20 disabled:scale-100 focus:scale-[1.02] hover:scale-[1.02] disabled:opacity-50 disabled:shadow-none outline-none"
                >
                    <Save size={20} />
                    {saving ? "Guardando..." : "Guardar"}
                </button>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500 bg-lime-50/60 border border-lime-200/40 p-3 rounded-2xl inline-block">Este valor se usará para generar la deuda inicial de todas las nuevas citas registradas.</p>
        </div>
    );
}

function BankAccountsCard() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        banco: "",
        numeroCuenta: "",
        titular: "",
        rifTitular: "",
        tipo: "CORRIENTE",
        activa: true
    });

    const loadAccounts = () => {
        setLoading(true);
        fetch("/api/billing/accounts")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAccounts(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadAccounts(); }, []);

    const handleEdit = (account: BankAccount) => {
        setFormData({
            banco: account.banco,
            numeroCuenta: account.numeroCuenta,
            titular: account.titular,
            rifTitular: account.rifTitular,
            tipo: account.tipo,
            activa: account.activa
        });
        setEditingId(account.cuentaId);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ banco: "", numeroCuenta: "", titular: "", rifTitular: "", tipo: "CORRIENTE", activa: true });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = "/api/billing/accounts";
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...formData, cuentaId: editingId } : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(editingId ? "Cuenta actualizada" : "Cuenta agregada");
                handleCancel();
                loadAccounts();
            } else {
                const err = await res.json();
                toast.error(err.error || "Error al guardar cuenta");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    return (
        <>
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.04)] border border-white/60 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-100/80 rounded-2xl border border-sky-200/50 shadow-sm">
                        <Building className="w-6 h-6 text-sky-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Cuentas Bancarias</h2>
                </div>
                <button
                    onClick={() => {
                        setFormData({ banco: "", numeroCuenta: "", titular: "", rifTitular: "", tipo: "CORRIENTE", activa: true });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-lime-50 text-lime-700 rounded-2xl text-sm font-bold transition-all shadow-[0_4px_12px_rgba(132,204,22,0.2)] border border-lime-500/80 ring-2 ring-lime-400/20 scale-[1.02]"
                >
                    <Plus size={18} />
                    Agregar Cuenta
                </button>
            </div>

            {/* List */}
            {
                loading ? (
                    <div className="text-center py-8 text-gray-500 font-bold animate-pulse">Cargando cuentas...</div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-16 bg-white/30 backdrop-blur-md rounded-3xl border border-dashed border-white/60 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/60 shadow-inner">
                            <CreditCard className="text-gray-400 w-8 h-8" />
                        </div>
                        <p className="text-gray-500 font-bold text-lg">No hay cuentas bancarias registradas.</p>
                        <p className="text-gray-400 text-sm mt-1">Registra una cuenta para recibir pagos por transferencia.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {accounts.map(acc => (
                            <div key={acc.cuentaId} className="relative p-6 rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md group hover:bg-white/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        <div className="p-2 bg-white/70 rounded-xl border border-white/80 shadow-sm"><CreditCard size={18} className="text-sky-600" /></div>
                                        {acc.banco}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold border shadow-sm ${acc.activa ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {acc.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(acc)}
                                            className="p-2 text-sky-600 font-bold hover:text-sky-700 hover:bg-sky-50 bg-white/60 outline-none focus:ring-2 focus:ring-sky-300 rounded-xl transition-all border border-sky-100 shadow-sm"
                                            title="Editar Cuenta"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="font-mono text-xl text-gray-800 tracking-wider mb-4 font-bold bg-white/50 inline-block px-4 py-2 rounded-2xl border border-white/60 shadow-inner">{acc.numeroCuenta}</p>
                                <div className="text-sm text-gray-500/80 font-medium space-y-1 bg-white/30 p-4 rounded-2xl border border-white/40">
                                    <p><span className="font-bold text-gray-700 uppercase tracking-wider text-xs mr-2">Titular</span> <span className="text-gray-900">{acc.titular}</span></p>
                                    <p><span className="font-bold text-gray-700 uppercase tracking-wider text-xs mr-2">RIF / Tipo</span> <span className="text-gray-900">{acc.rifTitular} • {acc.tipo}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div>

        {/* Add Form */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all animate-in fade-in duration-200">
                    <div className="bg-white/70 backdrop-blur-2xl w-full max-w-2xl rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 max-h-[90vh] flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="p-6 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-lime-500/10 border border-lime-500/20 shadow-inner flex items-center justify-center backdrop-blur-md">
                                    {editingId ? <Pencil size={18} className="text-sky-600" /> : <Building size={18} className="text-lime-600" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg tracking-tight">
                                        {editingId ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
                                    </h3>
                                    <p className="text-xs text-gray-500/80 font-medium">Completa los datos de la cuenta receptora</p>
                                </div>
                            </div>
                            <button type="button" onClick={handleCancel} className="p-2.5 rounded-full bg-white/40 hover:bg-white/60 border border-white/50 shadow-sm text-gray-500 hover:text-gray-700 transition-all">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col">
                            <div className="p-6 space-y-5 flex-1">

                                {/* Sección: Datos de la cuenta */}
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center">1</span>
                                        <h4 className="font-bold text-gray-800 text-base">Datos del Banco</h4>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Banco *</label>
                                        <input required
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                            value={formData.banco} onChange={e => setFormData({ ...formData, banco: e.target.value })} placeholder="Ej. Banco Mercantil" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Nro. Cuenta *</label>
                                        <input required
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none font-mono text-sm tracking-widest shadow-inner transition-all placeholder:text-gray-400"
                                            value={formData.numeroCuenta} onChange={e => setFormData({ ...formData, numeroCuenta: e.target.value })} placeholder="0105-1234-5678-9012" />
                                    </div>
                                </section>

                                {/* Sección: Titular */}
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center">2</span>
                                        <h4 className="font-bold text-gray-800 text-base">Datos del Titular</h4>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Nombre del Titular *</label>
                                        <input required
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                            value={formData.titular} onChange={e => setFormData({ ...formData, titular: e.target.value })} placeholder="Clínica Colinas C.A." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">RIF *</label>
                                            <input required
                                                className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                                value={formData.rifTitular} onChange={e => setFormData({ ...formData, rifTitular: e.target.value })} placeholder="J-12345678" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Tipo de Cuenta</label>
                                            <select
                                                className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-bold text-gray-800 shadow-inner transition-all"
                                                value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                                                <option value="CORRIENTE">Corriente</option>
                                                <option value="AHORRO">Ahorro</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* Toggle Switch (only on edit) */}
                                {editingId && (
                                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-base">{formData.activa ? 'Cuenta Activa' : 'Cuenta Inactiva'}</h4>
                                                <p className="text-sm text-gray-500 font-medium mt-0.5">{formData.activa ? 'Los pacientes verán esta cuenta en los métodos de pago.' : 'Esta cuenta estará oculta.'}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, activa: !formData.activa })}
                                                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${formData.activa ? 'bg-emerald-500/90 shadow-[0_4px_12px_rgba(16,185,129,0.3)]' : 'bg-gray-300 shadow-inner'}`}
                                            >
                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md border border-gray-100 ${formData.activa ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/40 flex gap-3 shrink-0 bg-white/30 backdrop-blur-md">
                                <button type="button" onClick={handleCancel} className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 py-3.5 rounded-2xl bg-lime-50 hover:bg-lime-100 text-lime-700 font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(132,204,22,0.25)] border border-lime-500/80 ring-2 ring-lime-400/20 outline-none focus:ring-lime-400/40">
                                    <Save size={18} />
                                    {editingId ? "Actualizar Cuenta" : "Guardar Cuenta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
