"use client";

import { useEffect, useState, useCallback } from "react";
import {
    X, Loader2, Activity, Package, FlaskConical, Stethoscope,
    Search, Check, AlertTriangle, Siren,
    Trash2, Warehouse, ChevronDown, Send
} from "lucide-react";

/* ─── Helpers ────────────────────────────────────────────── */
function fmtFecha(iso: string) {
    const d = new Date(iso);
    const hora = d.toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit", hour12: true });
    const fecha = d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${hora} · ${fecha}`;
}

/* ─── Urgency / Status helpers ───────────────────────────── */
const URGENCY_PILL: Record<string, string> = {
    CRITICO:  "bg-red-500 text-white",
    URGENTE:  "bg-orange-400 text-white",
    MODERADO: "bg-yellow-400 text-gray-900",
    LEVE:     "bg-green-400 text-white",
};

/* ─── Tab Button ─────────────────────────────────────────── */
function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                active
                    ? "bg-lime-500 text-white shadow-lg shadow-lime-100 border border-lime-400/40 scale-[1.02]"
                    : "text-gray-500 hover:bg-white/60 border border-transparent hover:border-white/60"
            }`}
        >
            <Icon size={14} /> {label}
        </button>
    );
}

/* ─── Tab 1.5: Solicitud a Farmacia (Quirófano) ──────────────── */
function TabSolicitudQuirofano({ emergenciaId }: { emergenciaId: string }) {
    const [query, setQuery]               = useState("");
    const [results, setResults]           = useState<any[]>([]);
    const [searching, setSearching]       = useState(false);
    const [cart, setCart]                 = useState<any[]>([]);
    const [saving, setSaving]             = useState(false);
    const [solicitudes, setSolicitudes]   = useState<any[]>([]);
    const [loading, setLoading]           = useState(true);

    useEffect(() => {
        fetchSolicitudes();
    }, []);

    const fetchSolicitudes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/emergency/${emergenciaId}/solicitud-insumo`);
            if (res.ok) setSolicitudes(await res.json());
        } catch {}
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                // Fetch globally sin almacenId
                const res = await fetch(`/api/insumos?search=${encodeURIComponent(query)}`);
                if (res.ok) setResults(await res.json());
            } catch {}
            finally { setSearching(false); }
        }, 350);
        return () => clearTimeout(timer);
    }, [query]);

    const handleEnviar = async () => {
        if (cart.length === 0) return;
        
        // Simple check
        const hasErrors = cart.some(c => {
            const cant = parseInt(c.cantidad);
            return !cant || cant <= 0;
        });
        if (hasErrors) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/emergency/${emergenciaId}/solicitud-insumo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    insumos: cart.map(item => ({ insumoId: item.insumo.insumoId, cantidad: parseInt(item.cantidad) })) 
                }),
            });
            if (res.ok) {
                setCart([]); setQuery(""); setResults([]);
                await fetchSolicitudes();
            }
        } catch {}
        finally { setSaving(false); }
    };

    const statusColor: Record<string, string> = {
        PENDIENTE: "bg-amber-100/80 text-amber-700 border-amber-200/50",
        APROBADA:  "bg-lime-100/80 text-lime-700 border-lime-200/50",
        RECHAZADA: "bg-red-100/80 text-red-700 border-red-200/50",
        DESPACHADA: "bg-blue-100/80 text-blue-700 border-blue-200/50",
    };

    return (
        <div className="space-y-5">
            {/* Cabecera explicativa */}
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-3xl p-4 flex gap-4 items-center shadow-inner">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Siren size={20} className="text-amber-500" />
                </div>
                <div>
                    <h4 className="font-black text-amber-900 text-sm">Paciente en Quirófano</h4>
                    <p className="text-xs text-amber-700/80 font-medium leading-relaxed mt-0.5">
                        Agrega aquí los insumos, la <strong>Solicitud a Farmacia</strong> se enviará para su respectivo despacho desde almacenes.
                    </p>
                </div>
            </div>

            {/* Insumo search */}
            <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">1</span>
                    <h4 className="font-bold text-gray-800">Buscar Insumo a solicitar</h4>
                </div>
                <div className="relative mb-2">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    {searching && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-lime-400" />}
                    <input
                        value={query}
                        onChange={e => { setQuery(e.target.value); }}
                        placeholder="Código o nombre (Sutura, Gasa...)"
                        className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-amber-400/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Results dropdown */}
                {results.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-md border border-white/70 rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] divide-y divide-white/50 mt-1 max-h-56 overflow-y-auto">
                        {results.map((ins: any) => {
                            return (
                                <button
                                    key={ins.insumoId}
                                    onClick={() => {
                                        if (!cart.some(c => c.insumo.insumoId === ins.insumoId)) {
                                            setCart([...cart, { insumo: ins, cantidad: "" }]);
                                        }
                                        setResults([]); setQuery("");
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-amber-50/60 transition-colors flex justify-between items-center gap-3"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{ins.nombre}</p>
                                        <p className="text-xs text-gray-500">{ins.marca} · {ins.codigo}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-gray-700">{ins.stockTotal}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">disp. global</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Cart */}
            {cart.length > 0 && (
                <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">2</span>
                        <h4 className="font-bold text-gray-800">Insumos solicitados</h4>
                    </div>
                    
                    <div className="space-y-2">
                        {cart.map((item, index) => {
                            const cant = parseInt(item.cantidad);
                            const isInvalid = !item.cantidad || cant <= 0;

                            return (
                                <div key={item.insumo.insumoId} className={`relative bg-amber-50/70 border rounded-2xl p-4 flex gap-4 items-center transition-all ${isInvalid ? 'border-red-200 shadow-[0_4px_12px_rgba(239,68,68,0.05)]' : 'border-amber-200/60'}`}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-gray-800 truncate">{item.insumo.nombre}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-gray-500">{item.insumo.codigo}</span>
                                            <span className="text-xs font-medium text-gray-400">· Stock global: {item.insumo.stockTotal}</span>
                                        </div>
                                    </div>
                                    <div className="w-24 shrink-0">
                                        <input
                                            type="number" step="1"
                                            value={item.cantidad}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (/^\d*$/.test(val)) {
                                                    const newCart = [...cart];
                                                    newCart[index].cantidad = val;
                                                    setCart(newCart);
                                                }
                                            }}
                                            placeholder="Cant:"
                                            className={`w-full px-3 py-2.5 rounded-xl bg-white border outline-none text-base font-black text-center shadow-inner transition-all ${
                                                isInvalid ? "border-red-400 focus:ring-2 focus:ring-red-400/20 text-red-600" : "border-gray-200 focus:ring-2 focus:ring-amber-400/30 text-gray-900"
                                            }`}
                                        />
                                    </div>
                                    <button onClick={() => {
                                        setCart(cart.filter((_, i) => i !== index));
                                    }} className="text-red-400 hover:text-red-600 hover:bg-red-50 bg-white shadow-sm border border-red-100 p-2.5 rounded-xl transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleEnviar} 
                            disabled={saving || cart.length === 0 || cart.some(c => !parseInt(c.cantidad) || parseInt(c.cantidad) <= 0)}
                            className="w-full flex items-center justify-center gap-2 font-black text-white bg-amber-500/95 hover:bg-amber-500 py-4 rounded-2xl shadow-[0_8px_20px_rgba(245,158,11,0.25)] border border-amber-400/50 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-[0.98] text-sm"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {saving ? "Enviando solicitud…" : `Enviar Solicitud a Farmacia`}
                        </button>
                    </div>
                </section>
            )}

            {/* Historial de solicitudes a farmacia */}
            <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Package size={15} className="text-amber-500" /> Historial de Solicitudes
                </h4>
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
                ) : solicitudes.length === 0 ? (
                    <p className="text-sm text-gray-400 font-medium text-center py-4">Ninguna solicitud enviada aún.</p>
                ) : (
                    <div className="space-y-3">
                        {solicitudes.map((s: any) => (
                            <div key={s.solicitudInsumoId} className="bg-white/50 border border-white/60 rounded-2xl p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${statusColor[s.estadoSolicitud] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                        {s.estadoSolicitud}
                                    </span>
                                    <span className="text-xs text-gray-400">{fmtFecha(s.fechaSolicitud)}</span>
                                </div>
                                <div className="space-y-1.5">
                                    {s.insumos.map((d: any) => (
                                        <div key={d.solicitudDetalleId} className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-700">{d.nombre}</span>
                                            <span className="font-black text-gray-900">{d.cantidad} <span className="text-xs font-medium text-gray-400">{d.unidad}</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

/* ─── Tab 1: Retiro de Insumos ────────────────────────────── */
function TabInsumos({ emergenciaId, estado }: { emergenciaId: string; estado: string }) {
    const isCirugia = estado === "CIRUGIA_URGENTE";

    const [almacenes, setAlmacenes]       = useState<any[]>([]);
    const [almacenId, setAlmacenId]       = useState("");
    const [query, setQuery]               = useState("");
    const [results, setResults]           = useState<any[]>([]);
    const [searching, setSearching]       = useState(false);
    const [cart, setCart]                 = useState<any[]>([]);
    const [saving, setSaving]             = useState(false);
    const [retiros, setRetiros]           = useState<any[]>([]);
    const [loadingRetiros, setLoadingRetiros] = useState(true);

    useEffect(() => {
        fetch("/api/almacen/list").then(r => r.ok ? r.json() : []).then(setAlmacenes).catch(() => {});
        fetchRetiros();
    }, []);

    const fetchRetiros = async () => {
        setLoadingRetiros(true);
        try {
            const res = await fetch(`/api/emergency/${emergenciaId}/retiro-insumo`);
            if (res.ok) setRetiros(await res.json());
        } catch {}
        finally { setLoadingRetiros(false); }
    };

    useEffect(() => {
        if (!query.trim() || !almacenId) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/insumos?search=${encodeURIComponent(query)}&almacenId=${almacenId}`);
                if (res.ok) setResults(await res.json());
            } catch {}
            finally { setSearching(false); }
        }, 350);
        return () => clearTimeout(timer);
    }, [query, almacenId]);

    const handleRetirar = async () => {
        if (cart.length === 0 || !almacenId) return;
        
        // Final validation check before submitting
        const hasErrors = cart.some(c => {
            const max = c.insumo.stock.find((s: any) => s.almacenId === almacenId)?.cantidadActual ?? 0;
            const cant = parseInt(c.cantidad);
            return !cant || cant <= 0 || cant > max;
        });
        if (hasErrors) return;

        setSaving(true);
        try {
            await Promise.all(cart.map(item => 
                fetch(`/api/emergency/${emergenciaId}/retiro-insumo`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ almacenId, insumoId: item.insumo.insumoId, cantidad: parseInt(item.cantidad) }),
                })
            ));
            setCart([]); setQuery(""); setResults([]);
            await fetchRetiros();
        } catch {}
        finally { setSaving(false); }
    };

    if (isCirugia) {
        return <TabSolicitudQuirofano emergenciaId={emergenciaId} />;
    }

    return (
        <div className="space-y-5">
            {/* Almacén selector */}
            <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">1</span>
                    <h4 className="font-bold text-gray-800">Seleccionar Almacén</h4>
                </div>
                <div className="relative">
                    <Warehouse size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={almacenId}
                        onChange={e => { setAlmacenId(e.target.value); setCart([]); setResults([]); setQuery(""); }}
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-400/50 outline-none text-sm font-medium shadow-inner transition-all appearance-none"
                    >
                        <option value="">— Selecciona el almacén de retiro —</option>
                        {almacenes.map((a: any) => (
                            <option key={a.almacenId} value={a.almacenId}>{a.nombre}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </section>

            {/* Insumo search */}
            {almacenId && (
                <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">2</span>
                        <h4 className="font-bold text-gray-800">Buscar Insumo</h4>
                    </div>
                    <div className="relative mb-2">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        {searching && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-lime-400" />}
                        <input
                            value={query}
                            onChange={e => { setQuery(e.target.value); }}
                            placeholder="Código o nombre (Gasa, suero...)"
                            className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-400/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* Results dropdown */}
                    {results.length > 0 && (
                        <div className="bg-white/80 backdrop-blur-md border border-white/70 rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] divide-y divide-white/50 mt-1">
                            {results.map((ins: any) => {
                                const stockEnAlmacen = ins.stock.find((s: any) => s.almacenId === almacenId);
                                if (!stockEnAlmacen) return null;
                                return (
                                    <button
                                        key={ins.insumoId}
                                        onClick={() => {
                                            if (!cart.some(c => c.insumo.insumoId === ins.insumoId)) {
                                                setCart([...cart, { insumo: ins, cantidad: "" }]);
                                            }
                                            setResults([]); setQuery("");
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-lime-50/60 transition-colors flex justify-between items-center gap-3"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{ins.nombre}</p>
                                            <p className="text-xs text-gray-500">{ins.marca} · {ins.codigo}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-lime-700">{stockEnAlmacen.cantidadActual}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{ins.unidadMedida}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {cart.length > 0 && (
                <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">3</span>
                        <h4 className="font-bold text-gray-800">Insumos a retirar</h4>
                    </div>
                    
                    <div className="space-y-2">
                        {cart.map((item, index) => {
                            const maxStock = item.insumo.stock.find((s: any) => s.almacenId === almacenId)?.cantidadActual ?? 0;
                            const cant = parseInt(item.cantidad);
                            const isInvalid = !item.cantidad || cant <= 0 || cant > maxStock;

                            return (
                                <div key={item.insumo.insumoId} className={`relative bg-lime-50/70 border rounded-2xl p-4 flex gap-4 items-center transition-all ${isInvalid ? 'border-red-200 shadow-[0_4px_12px_rgba(239,68,68,0.05)]' : 'border-lime-200/60'}`}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-gray-800 truncate">{item.insumo.nombre}</p>
                                        <p className="text-[11px] font-bold text-gray-500 truncate mt-0.5">{item.insumo.codigo}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-500">Stock: <span className="font-black text-lime-700">{maxStock}</span></span>
                                        </div>
                                        {item.cantidad && cant > maxStock && (
                                            <p className="text-[10px] font-black text-red-500 mt-1 flex items-center gap-1">
                                                <AlertTriangle size={10} /> Supera stock ({maxStock})
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-24 shrink-0">
                                        <input
                                            type="number" step="1"
                                            value={item.cantidad}
                                            onChange={e => {
                                                const val = e.target.value;
                                                // Live sanitization: allow only digits (avoiding decimals or symbols)
                                                if (/^\d*$/.test(val)) {
                                                    const newCart = [...cart];
                                                    newCart[index].cantidad = val;
                                                    setCart(newCart);
                                                }
                                            }}
                                            placeholder="Cant:"
                                            className={`w-full px-3 py-2.5 rounded-xl bg-white border outline-none text-base font-black text-center shadow-inner transition-all ${
                                                isInvalid ? "border-red-400 focus:ring-2 focus:ring-red-400/20 text-red-600" : "border-gray-200 focus:ring-2 focus:ring-lime-400/30 text-gray-900"
                                            }`}
                                        />
                                    </div>
                                    <button onClick={() => {
                                        setCart(cart.filter((_, i) => i !== index));
                                    }} className="text-red-400 hover:text-red-600 hover:bg-red-50 bg-white shadow-sm border border-red-100 p-2.5 rounded-xl transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleRetirar} 
                            disabled={saving || cart.length === 0 || cart.some(c => {
                                const max = c.insumo.stock.find((s: any) => s.almacenId === almacenId)?.cantidadActual ?? 0;
                                const val = parseInt(c.cantidad);
                                return !val || val <= 0 || val > max;
                            })}
                            className="w-full flex items-center justify-center gap-2 font-black text-white bg-lime-500/95 hover:bg-lime-500 py-4 rounded-2xl shadow-[0_8px_20px_rgba(132,204,22,0.25)] border border-lime-400/50 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-[0.98] text-sm"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {saving ? "Registrando retiros…" : `Confirmar ${cart.length} retiro${cart.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </section>
            )}

            {/* Historial de retiros */}
            <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Package size={15} className="text-lime-500" /> Retiros registrados en este caso
                </h4>
                {loadingRetiros ? (
                    <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-lime-400" /></div>
                ) : retiros.length === 0 ? (
                    <p className="text-sm text-gray-400 font-medium text-center py-4">Ningún retiro registrado aún.</p>
                ) : (
                    <div className="space-y-2.5">
                        {retiros.map((r: any) => (
                            <div key={r.movimientoId} className="bg-white/50 border border-white/60 rounded-2xl p-3.5">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xs font-bold text-gray-500">{r.almacen} · {fmtFecha(r.fechaMovimiento)}</p>
                                    <p className="text-xs text-gray-400">{r.enfermera}</p>
                                </div>
                                {r.detalles.map((d: any) => (
                                    <div key={d.insumoId} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700">{d.insumo}</span>
                                        <span className="font-black text-gray-900">{d.cantidad} <span className="text-xs font-medium text-gray-400">{d.unidad}</span></span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

/* ─── Tab 2: Solicitud de Exámenes (Lab / Img) ───────────────── */
function TabExamenes({ emergenciaId, citaId }: { emergenciaId: string; citaId: string | null }) {
    const [tipoPedido, setTipoPedido]   = useState<"none" | "lab" | "img">("none");
    const [examenes, setExamenes]       = useState<any[]>([]);
    const [selected, setSelected]       = useState<Set<string>>(new Set());
    const [obs, setObs]                 = useState("");
    const [saving, setSaving]           = useState(false);
    
    // Historias
    const [solicitudesLab, setSolicitudesLab] = useState<any[]>([]);
    const [solicitudesImg, setSolicitudesImg] = useState<any[]>([]);
    const [loadingHist, setLoadingHist]       = useState(true);
    
    const [loadingCat, setLoadingCat]         = useState(false);
    const [error, setError]             = useState<string | null>(null);

    const statusColor: Record<string, string> = {
        PENDIENTE: "bg-amber-100/80 text-amber-700 border-amber-200/50",
        APROBADA:  "bg-lime-100/80 text-lime-700 border-lime-200/50",
        ATENDIDA:  "bg-blue-100/80 text-blue-700 border-blue-200/50",
        RECHAZADA: "bg-red-100/80 text-red-700 border-red-200/50",
    };

    useEffect(() => {
        if (!citaId) return;
        fetchHistories();
    }, [citaId]);

    const fetchHistories = async () => {
        setLoadingHist(true);
        try {
            const [resLab, resImg] = await Promise.all([
                fetch(`/api/emergency/${emergenciaId}/solicitud-lab`),
                fetch(`/api/emergency/${emergenciaId}/solicitud-img`) // Note: Assuming this exists or returns similar shape
            ]);
            
            if (resLab.ok) setSolicitudesLab(await resLab.json());
            if (resImg.ok) setSolicitudesImg(await resImg.json());
        } catch (e) {
            console.error("Failed to fetch histories");
        } finally {
            setLoadingHist(false);
        }
    };

    const handleSelectType = async (type: "lab" | "img") => {
        setTipoPedido(type);
        setExamenes([]);
        setSelected(new Set());
        setLoadingCat(true);
        try {
            const url = type === "lab" ? "/api/laboratorio/examenes" : "/api/imagenologia/examenes";
            const res = await fetch(url);
            if (res.ok) setExamenes(await res.json());
        } catch {
        } finally {
            setLoadingCat(false);
        }
    };

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleEnviar = async () => {
        if (selected.size === 0) return;
        setError(null);
        setSaving(true);
        try {
            const endpoint = tipoPedido === "lab" ? `/api/emergency/${emergenciaId}/solicitud-lab` : `/api/emergency/${emergenciaId}/solicitud-img`;
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examenIds: Array.from(selected), observaciones: obs }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Error al enviar"); return; }
            
            setSelected(new Set()); 
            setObs("");
            setTipoPedido("none"); // Reset view
            await fetchHistories();
        } catch { setError("Error de red"); }
        finally { setSaving(false); }
    };

    if (!citaId) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-200/60 flex items-center justify-center">
                    <AlertTriangle size={28} className="text-amber-500" />
                </div>
                <div className="text-center max-w-xs">
                    <h4 className="font-black text-gray-800 mb-2">Sin cita asociada</h4>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Esta emergencia no tiene una cita médica vinculada, por lo que no se pueden registrar órdenes de exámenes. Contacta al administrador.
                    </p>
                </div>
            </div>
        );
    }

    const allRequests = [
        ...solicitudesLab.map(s => ({ ...s, sysType: 'LAB' })),
        ...solicitudesImg.map(s => ({ ...s, sysType: 'IMG', solicitudLabId: s.solicitudImgId }))
    ].sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());

    return (
        <div className="space-y-5">
            {/* Exam selector state machine */}
            <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">1</span>
                    <h4 className="font-bold text-gray-800">
                        {tipoPedido === "none" ? "¿Qué deseas solicitar?" : `Seleccionar Exámenes de ${tipoPedido === "lab" ? "Laboratorio" : "Imagenología"}`}
                    </h4>
                </div>

                {tipoPedido === "none" ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleSelectType("lab")}
                            className="bg-white/50 hover:bg-lime-50/80 border border-white/60 hover:border-lime-200 p-5 rounded-2xl flex flex-col items-center text-center transition-all group"
                        >
                            <FlaskConical size={32} className="text-lime-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-black text-gray-800">Laboratorio</span>
                            <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Sangre, Orina, Heces...</span>
                        </button>
                        <button 
                            onClick={() => handleSelectType("img")}
                            className="bg-white/50 hover:bg-blue-50/80 border border-white/60 hover:border-blue-200 p-5 rounded-2xl flex flex-col items-center text-center transition-all group"
                        >
                            <Activity size={32} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-black text-gray-800">Imagenología</span>
                            <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Rayos X, Ecografías...</span>
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-end mb-3">
                            <button onClick={() => { setTipoPedido("none"); setExamenes([]); }} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 bg-white/50 px-3 py-1 rounded-full">
                                ← Cambiar Tipo
                            </button>
                        </div>
                        {loadingCat ? (
                            <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-lime-400" /></div>
                        ) : examenes.length === 0 ? (
                            <p className="text-sm font-bold text-gray-400 text-center py-4">No hay exámenes cargados en el sistema.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                {examenes.map((ex: any) => {
                                    const isSelected = selected.has(ex.examenId);
                                    return (
                                        <button
                                            key={ex.examenId}
                                            onClick={() => toggle(ex.examenId)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold transition-all text-left ${
                                                isSelected
                                                    ? `bg-${tipoPedido === 'lab' ? 'lime' : 'blue'}-50/80 border-${tipoPedido === 'lab' ? 'lime' : 'blue'}-400/50 text-${tipoPedido === 'lab' ? 'lime' : 'blue'}-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-${tipoPedido === 'lab' ? 'lime' : 'blue'}-300/30 scale-[1.01]`
                                                    : "bg-white/40 border-white/50 text-gray-600 hover:bg-white/60"
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                isSelected ? `border-${tipoPedido === 'lab' ? 'lime' : 'blue'}-500 bg-${tipoPedido === 'lab' ? 'lime' : 'blue'}-500` : "border-gray-300"
                                            }`}>
                                                {isSelected && <Check size={11} className="text-white" />}
                                            </div>
                                            <span>{ex.nombre}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Observaciones + enviar */}
            {selected.size > 0 && (
                <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">2</span>
                        <h4 className="font-bold text-gray-800">{selected.size} examen{selected.size > 1 ? "es" : ""} seleccionado{selected.size > 1 ? "s" : ""}</h4>
                    </div>
                    <textarea
                        value={obs} onChange={e => setObs(e.target.value)}
                        rows={2} placeholder={`Observaciones para el ${tipoPedido === 'lab' ? 'laboratorista' : 'técnico'}…`}
                        className={`w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 outline-none text-sm font-medium shadow-inner transition-all resize-none placeholder:text-gray-400 focus:bg-white/80 focus:ring-2 focus:ring-${tipoPedido === 'lab' ? 'lime' : 'blue'}-400/50`}
                    />
                    {error && <p className="text-xs font-bold text-red-600">{error}</p>}
                    <button
                        onClick={handleEnviar} disabled={saving}
                        className={`w-full flex items-center justify-center gap-2 font-black text-white bg-${tipoPedido === 'lab' ? 'lime' : 'blue'}-500/95 hover:bg-${tipoPedido === 'lab' ? 'lime' : 'blue'}-500 py-3.5 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] border border-${tipoPedido === 'lab' ? 'lime' : 'blue'}-400/50 transition-all disabled:opacity-50 text-sm`}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {saving ? "Enviando orden…" : "Enviar Solicitud"}
                    </button>
                </section>
            )}

            {/* Historial de solicitudes */}
            <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <FlaskConical size={15} className="text-gray-500" /> Órdenes enviadas
                </h4>
                {loadingHist ? (
                    <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
                ) : allRequests.length === 0 ? (
                    <p className="text-sm text-gray-400 font-medium text-center py-4">Ninguna orden enviada aún.</p>
                ) : (
                    <div className="space-y-3">
                        {allRequests.map((s: any) => {
                            const isLab = s.sysType === 'LAB';
                            return (
                            <div key={`${s.sysType}-${s.solicitudLabId}`} className="bg-white/50 border border-white/60 rounded-2xl p-3.5">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md text-white shadow-sm ${isLab ? "bg-lime-500" : "bg-blue-500"}`}>
                                            {isLab ? "LABORATORIO" : "IMAGENOLOGÍA"}
                                        </span>
                                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${statusColor[s.estadoSolicitud] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                            {s.estadoSolicitud}
                                        </span>
                                    </div>
                                    <span className="text-[10px] uppercase font-black text-gray-400">{fmtFecha(s.fechaSolicitud)}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {s.examenes.map((ex: any) => (
                                        <span key={ex.detalleLabId || ex.detalleImgId} className="text-[10px] uppercase font-bold bg-white text-gray-700 border border-gray-200 rounded-full px-2.5 py-1">
                                            {ex.nombre}
                                        </span>
                                    ))}
                                </div>
                                {s.observaciones && <p className="text-xs text-gray-500 mt-2 italic">"{s.observaciones}"</p>}
                            </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

/* ─── Main Panel Component ───────────────────────────────── */
export default function GestionPacientePanel({
    emergenciaId, onClose, onStatusChange,
}: {
    emergenciaId: string; onClose: () => void; onStatusChange: () => void;
}) {
    const [emergencia, setEmergencia] = useState<any>(null);
    const [isLoading, setIsLoading]   = useState(true);
    const [activeTab, setActiveTab]   = useState<"insumos" | "lab">("insumos");

    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/emergency/${emergenciaId}`)
            .then(r => r.ok ? r.json() : null)
            .then(setEmergencia)
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [emergenciaId]);

    return (
        /* Backdrop */
        <div className="fixed inset-0 bg-slate-900/30 z-50 flex items-center justify-end p-4 backdrop-blur-sm">
            {/* Panel */}
            <div className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full max-w-[520px] h-full max-h-[95vh] rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.14)] border border-white/60 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/40 flex justify-between items-start shrink-0 bg-white/30">
                    {isLoading || !emergencia ? (
                        <div className="flex items-center gap-3">
                            <Loader2 size={20} className="animate-spin text-lime-500" />
                            <span className="font-bold text-gray-700">Cargando caso…</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-lime-500/10 border border-lime-400/20 flex items-center justify-center shrink-0">
                                <Stethoscope size={18} className="text-lime-600" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-black text-gray-900 text-base tracking-tight truncate">
                                    {typeof emergencia.paciente === "object"
                                        ? `${emergencia.paciente.nombres} ${emergencia.paciente.apellidos}`
                                        : emergencia.paciente}
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${URGENCY_PILL[emergencia.nivelUrgencia] ?? "bg-gray-200 text-gray-700"}`}>
                                        {emergencia.nivelUrgencia}
                                    </span>
                                    <span className="text-[11px] text-gray-500 font-medium">#{emergencia.emergenciaId}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <button onClick={onClose} className="p-2.5 rounded-full bg-white/40 hover:bg-white/60 border border-white/50 text-gray-500 hover:text-gray-700 transition-all shadow-sm shrink-0">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                {!isLoading && emergencia && (
                    <div className="px-4 pt-4 pb-0 flex gap-1.5 shrink-0 border-b border-white/40 flex-wrap">
                        <TabBtn active={activeTab === "insumos"} onClick={() => setActiveTab("insumos")} icon={Package}      label="Insumos"  />
                        <TabBtn active={activeTab === "lab"}     onClick={() => setActiveTab("lab")}     icon={FlaskConical} label="Exámenes" />
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                            <Loader2 size={28} className="animate-spin text-lime-400" />
                            <p className="text-sm font-bold text-gray-400">Cargando datos del paciente…</p>
                        </div>
                    ) : !emergencia ? (
                        <div className="text-center py-20 text-gray-400 font-medium text-sm">No se encontró la emergencia.</div>
                    ) : (
                        <>
                            {activeTab === "insumos" && (
                                <TabInsumos emergenciaId={emergenciaId} estado={emergencia.estadoEmergencia} />
                            )}
                            {activeTab === "lab" && (
                                <TabExamenes emergenciaId={emergenciaId} citaId={emergencia.citaId || null} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
