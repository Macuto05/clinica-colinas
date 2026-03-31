"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, Check, Search, Plus, Trash, Factory, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Interfaces
interface Almacen {
    almacenId: string;
    nombre: string;
}

interface ItemStock {
    stockId: string;
    insumoId: string;
    cantidadActual: number;
    insumo: {
        nombre: string;
        codigo: string;
        unidadMedida: string;
    };
}

interface TransferItem {
    insumoId: string;
    nombre: string;
    codigo: string;
    unidad: string;
    cantidad: number;
    stockDisponible: number;
}

export default function TrasladosPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Steps: 1=Route, 2=Items, 3=Confirm
    const [step, setStep] = useState(1);

    // Data
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [origen, setOrigen] = useState("");
    const [destino, setDestino] = useState("");

    // Stock Search
    const [searchTerm, setSearchTerm] = useState("");
    const [stockResults, setStockResults] = useState<ItemStock[]>([]);
    const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // --- 1. Load Warehouses ---
    useEffect(() => {
        fetch("/api/inventory/warehouses")
            .then(res => res.json())
            .then(data => setAlmacenes(data))
            .catch(err => console.error(err));
    }, []);

    // --- 2. Search Stock in Origin ---
    useEffect(() => {
        if (!origen) return;
        if (searchTerm.length < 2) {
            setStockResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const url = `/api/inventory/stocks?almacenId=${origen}&search=${searchTerm}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setStockResults(data);
                }
            } catch (e) {
                console.error("Search error:", e);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, origen]);


    const handleAddItem = (item: ItemStock) => {
        if (selectedItems.find(i => i.insumoId === item.insumoId)) return;
        setSelectedItems([...selectedItems, {
            insumoId: item.insumoId,
            nombre: item.insumo.nombre,
            codigo: item.insumo.codigo,
            unidad: item.insumo.unidadMedida,
            cantidad: 1,
            stockDisponible: Number(item.cantidadActual)
        }]);
        setSearchTerm(""); // clear search
    };

    const handleUpdateQuantity = (id: string, qty: number) => {
        setSelectedItems(selectedItems.map(i => i.insumoId === id ? { ...i, cantidad: qty } : i));
    };

    const handleDelete = (id: string) => {
        setSelectedItems(selectedItems.filter(i => i.insumoId !== id));
    };

    // --- 3. Submit ---
    const handleSubmit = async () => {
        if (!origen || !destino || selectedItems.length === 0) return;
        setIsSubmitting(true);
        setError("");

        try {
            const payload = {
                tipo: "TRASLADO",
                usuarioId: user?.id || "1",
                almacenId: origen,
                almacenDestinoId: destino,
                motivo: `Traslado manual de ${origen} a ${destino}`,
                items: selectedItems.map(i => ({
                    insumoId: i.insumoId,
                    cantidad: i.cantidad,
                    almacenId: origen // Source for deduction
                }))
            };

            const res = await fetch("/api/inventory/movements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al procesar traslado");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/almacen/movimientos");
            }, 2000);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER ---

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-500/10 border border-emerald-200/50 rounded-full flex items-center justify-center text-emerald-600 mb-8 shadow-lg shadow-emerald-500/10"
                >
                    <Check size={48} />
                </motion.div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3 uppercase">¡Traslado Exitoso!</h2>
                <p className="text-gray-500 font-medium">El inventario ha sido actualizado correctamente.</p>
                <p className="text-[10px] font-black text-gray-400 mt-8 uppercase tracking-[0.2em] animate-pulse">Redirigiendo al historial...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-lime-500/10 rounded-xl">
                            <ArrowLeftRight className="text-lime-600" size={24} />
                        </div>
                        Nuevo Traslado Inteligente
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Mueve insumos entre almacenes con gestión automática de lotes (FEFO).</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-white/60 shadow-inner">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500",
                                step === s 
                                    ? "bg-[#a1db4b] text-white shadow-lg shadow-lime-500/20 scale-110" 
                                    : s < step 
                                        ? "bg-emerald-500/10 text-emerald-600" 
                                        : "bg-white/50 text-gray-400"
                            )}>
                                {s < step ? <Check size={16} /> : s}
                            </div>
                            {s < 3 && <div className="w-6 h-0.5 bg-gray-200/50 mx-1" />}
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Route */}
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white/40 backdrop-blur-md p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] border border-white/50 space-y-12"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Almacén Origen (Desde)</label>
                                <div className="relative group">
                                    <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-600 transition-colors" size={20} />
                                    <select
                                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 appearance-none shadow-sm transition-all"
                                        value={origen}
                                        onChange={(e) => setOrigen(e.target.value)}
                                    >
                                        <option value="">Seleccionar Origen...</option>
                                        {almacenes.map(a => (
                                            <option key={a.almacenId} value={a.almacenId} disabled={a.almacenId === destino}>
                                                {a.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Almacén Destino (Hacia)</label>
                                <div className="relative group">
                                    <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-600 transition-colors" size={20} />
                                    <select
                                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 appearance-none shadow-sm transition-all"
                                        value={destino}
                                        onChange={(e) => setDestino(e.target.value)}
                                    >
                                        <option value="">Seleccionar Destino...</option>
                                        {almacenes.map(a => (
                                            <option key={a.almacenId} value={a.almacenId} disabled={a.almacenId === origen}>
                                                {a.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6">
                            <button
                                disabled={!origen || !destino}
                                onClick={() => setStep(2)}
                                className="bg-[#a1db4b] text-white px-10 py-4 rounded-2xl hover:bg-[#8cc63f] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-lg shadow-lime-500/20 active:scale-95"
                            >
                                Continuar
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Selection */}
                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Left: Search & Available */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white/40 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-sm">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-600 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Buscar insumo en origen..."
                                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 shadow-inner"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                                <div className="p-6 border-b border-white/40 bg-white/20 backdrop-blur-sm flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Insumos Disponibles</h3>
                                    <div className="text-[10px] font-black bg-lime-500/10 text-lime-700 px-3 py-1 rounded-full border border-lime-200/50">
                                        { stockResults.length } RESULTADOS
                                    </div>
                                </div>
                                <div className="divide-y divide-white/20 overflow-y-auto custom-scrollbar flex-1">
                                    {isSearching ? (
                                        <div className="p-20 flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-lime-600" size={40} />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escaneando inventario...</p>
                                        </div>
                                    ) : stockResults.length > 0 ? (
                                        stockResults.map(item => (
                                            <div key={item.stockId} className="p-6 flex items-center justify-between hover:bg-white/60 transition-all group">
                                                <div>
                                                    <div className="font-black text-gray-900 group-hover:text-lime-700 transition-colors uppercase tracking-tight">{item.insumo.nombre}</div>
                                                    <div className="text-[10px] font-mono text-gray-400 mt-0.5">{item.insumo.codigo}</div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <div className="text-xl font-black text-gray-900">{Number(item.cantidadActual)}</div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.insumo.unidadMedida}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddItem(item)}
                                                        className="p-3 bg-lime-500/10 text-lime-600 rounded-xl hover:bg-[#a1db4b] hover:text-white transition-all shadow-none hover:shadow-lg hover:shadow-lime-500/20 active:scale-90"
                                                    >
                                                        <Plus size={20} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-20 text-center">
                                            <div className="w-16 h-16 bg-gray-500/5 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6 border border-white/50">
                                                <Search size={32} />
                                            </div>
                                            <p className="text-gray-400 font-bold text-sm">
                                                {searchTerm.length > 0
                                                    ? `No se encontraron insumos que coincidan con "${searchTerm}".`
                                                    : "Use el buscador para encontrar insumos disponibles."
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Selected List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] sticky top-8 flex flex-col h-[calc(100vh-160px)]">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                    LISTA DE TRASLADO
                                    <span className="bg-lime-500/10 text-lime-700 px-3 py-1 rounded-full border border-lime-200/50">{selectedItems.length}</span>
                                </h3>

                                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                                    {selectedItems.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center gap-4 opacity-40">
                                            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                <Plus size={20} />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">Añade insumos de la lista</p>
                                        </div>
                                    ) : (
                                        selectedItems.map(item => {
                                            const isError = item.cantidad <= 0 || item.cantidad > item.stockDisponible;
                                            return (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={item.insumoId} 
                                                    className={cn(
                                                        "bg-white/50 backdrop-blur-sm p-5 rounded-3xl border relative group transition-all duration-300 shadow-sm",
                                                        isError ? 'border-rose-400 bg-rose-50/10' : 'border-white/80 hover:border-lime-400 overflow-hidden'
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-xs font-black text-gray-800 uppercase tracking-tight line-clamp-1">{item.nombre}</span>
                                                        <button 
                                                            onClick={() => handleDelete(item.insumoId)} 
                                                            className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                                                        >
                                                            <Trash size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.stockDisponible}
                                                                value={item.cantidad}
                                                                onChange={(e) => handleUpdateQuantity(item.insumoId, Number(e.target.value))}
                                                                className={cn(
                                                                    "w-full pl-4 pr-16 py-2 font-black text-sm border rounded-2xl bg-white/80 outline-none transition-all",
                                                                    isError
                                                                        ? 'border-rose-500 text-rose-600 ring-4 ring-rose-500/10'
                                                                        : 'border-white/60 focus:ring-4 focus:ring-lime-500/10 focus:border-lime-500/50'
                                                                )}
                                                            />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400/60 uppercase">
                                                                {item.unidad}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest mt-2 flex justify-between px-1",
                                                        isError ? 'text-rose-600' : 'text-gray-400'
                                                    )}>
                                                        <span>STOCK DISP.</span>
                                                        <span>{item.stockDisponible}</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="pt-6 mt-6 border-t border-white/40 space-y-3">
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={selectedItems.length === 0 || selectedItems.some(i => i.cantidad <= 0 || i.cantidad > i.stockDisponible)}
                                        className="w-full bg-[#a1db4b] text-white py-4 rounded-2xl hover:bg-[#8cc63f] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-lime-500/20 active:scale-95"
                                    >
                                        Revisar Traslado
                                    </button>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full py-3 text-gray-400 hover:text-gray-700 font-bold uppercase tracking-widest text-[10px] transition-colors"
                                    >
                                        Atrás
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto bg-white/40 backdrop-blur-md p-12 rounded-[3rem] shadow-[0_8px_48px_0_rgba(0,0,0,0.05)] border border-white/50"
                    >
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight text-center mb-10 uppercase tracking-[0.2em]">Resumen del Traslado</h3>

                        <div className="flex items-center gap-6 mb-12 bg-white/50 backdrop-blur-sm p-8 rounded-[2rem] border border-white/80 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-[#a1db4b]/20" />
                            <div className="text-center flex-1">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Origen</div>
                                <div className="font-black text-gray-900 text-xl tracking-tight">
                                    {almacenes.find(a => a.almacenId === origen)?.nombre}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-lime-500/10 rounded-full flex items-center justify-center text-lime-600 shadow-sm border border-lime-200/50">
                                <ArrowRight size={20} />
                            </div>
                            <div className="text-center flex-1">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Destino</div>
                                <div className="font-black text-gray-900 text-xl tracking-tight">
                                    {almacenes.find(a => a.almacenId === destino)?.nombre}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 mb-12">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-white/40 pb-3 flex items-center gap-2">
                                <Plus size={14} />
                                Ítems por Trasladar
                            </h4>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                {selectedItems.map(item => (
                                    <div key={item.insumoId} className="flex justify-between items-center bg-white/30 p-4 rounded-2xl border border-white/50">
                                        <div>
                                            <div className="font-black text-gray-900 uppercase tracking-tight text-sm">{item.nombre}</div>
                                            <div className="text-[10px] font-mono text-gray-400 mt-1">{item.codigo}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-gray-900">
                                                {item.cantidad}
                                            </div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.unidad}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 text-rose-700 p-6 rounded-2xl mb-8 text-sm font-bold border border-rose-200/50 text-center flex items-center gap-3 justify-center">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-4 bg-white/50 border border-white/60 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/80 active:scale-95"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-[2] bg-[#a1db4b] text-white py-4 rounded-2xl hover:bg-[#8cc63f] transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-lime-500/20 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-3"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                {isSubmitting ? "Procesando..." : "Confirmar Traslado"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const AlertCircle = ({ size }: { size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
)
