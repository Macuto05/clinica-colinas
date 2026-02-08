
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
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración Financiera</h1>
                    <p className="text-gray-500 dark:text-gray-400">Administra precios y cuentas bancarias</p>
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
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Precio Consulta Base</h2>
            </div>

            <div className="flex items-end gap-4 max-w-md">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Monto en USD ($)
                    </label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-lg"
                        placeholder="0.00"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? "Guardando..." : "Guardar"}
                </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">Este valor se usará para generar la deuda inicial de todas las nuevas citas.</p>
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
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cuentas Bancarias</h2>
                </div>
                <button
                    onClick={() => {
                        setFormData({ banco: "", numeroCuenta: "", titular: "", rifTitular: "", tipo: "CORRIENTE", activa: true });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Agregar Cuenta
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-zinc-800">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingId ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
                            </h3>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Banco</label>
                                <input required className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.banco} onChange={e => setFormData({ ...formData, banco: e.target.value })} placeholder="Ej. Banco Mercantil" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nro. Cuenta</label>
                                <input required className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.numeroCuenta} onChange={e => setFormData({ ...formData, numeroCuenta: e.target.value })} placeholder="0105..." />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Titular</label>
                                <input required className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.titular} onChange={e => setFormData({ ...formData, titular: e.target.value })} placeholder="Nombre titular" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">RIF</label>
                                <input required className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.rifTitular} onChange={e => setFormData({ ...formData, rifTitular: e.target.value })} placeholder="J-12345678" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                                <select className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                                    <option value="CORRIENTE">Corriente</option>
                                    <option value="AHORRO">Ahorro</option>
                                </select>
                            </div>

                            {/* Toggle Switch */}
                            {editingId && (
                                <div className="col-span-1 md:col-span-2 flex items-center gap-3 mt-2 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, activa: !formData.activa })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${formData.activa ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.activa ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formData.activa ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                                    </span>
                                </div>
                            )}

                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors shadow-sm">
                                    {editingId ? "Actualizar Cuenta" : "Guardar Cuenta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {
                loading ? (
                    <div className="text-center py-8 text-gray-500">Cargando cuentas...</div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700">
                        <p className="text-gray-500">No hay cuentas bancarias registradas.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {accounts.map(acc => (
                            <div key={acc.cuentaId} className="relative p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gradient-to-br from-gray-50 to-white dark:from-zinc-800 dark:to-zinc-900 group hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <CreditCard size={18} className="text-gray-400" />
                                        {acc.banco}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${acc.activa ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                            {acc.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(acc)}
                                            className="p-1 text-lime-600 hover:text-lime-700 hover:bg-lime-50 dark:hover:bg-lime-900/10 rounded transition-colors"
                                            title="Editar Cuenta"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </div>
                                </div>
                                <p className="font-mono text-lg text-gray-800 dark:text-gray-200 tracking-wider mb-2">{acc.numeroCuenta}</p>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p><span className="font-medium">Titular:</span> {acc.titular}</p>
                                    <p><span className="font-medium">RIF:</span> {acc.rifTitular} • {acc.tipo}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
}
