"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, Check, Search, Plus, Trash, Factory } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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
                <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center text-lime-600 mb-6 animate-bounce">
                    <Check size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Traslado Exitoso!</h2>
                <p className="text-gray-500">El inventario ha sido actualizado correctamente.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowLeftRight className="text-lime-600" />
                    Nuevo Traslado Inteligente
                </h1>
                <p className="text-gray-500 text-sm mt-1">Mueve insumos entre almacenes con gestión automática de lotes (FEFO).</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-lime-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-lime-600 bg-lime-50' : 'border-gray-300'}`}>1</div>
                    <span>Ruta</span>
                </div>
                <div className="h-0.5 w-12 bg-gray-200"></div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-lime-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-lime-600 bg-lime-50' : 'border-gray-300'}`}>2</div>
                    <span>Selección</span>
                </div>
                <div className="h-0.5 w-12 bg-gray-200"></div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-lime-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-lime-600 bg-lime-50' : 'border-gray-300'}`}>3</div>
                    <span>Confirmar</span>
                </div>
            </div>

            {/* Step 1: Route */}
            {step === 1 && (
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Almacén Origen (Desde)</label>
                            <div className="relative">
                                <Factory className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
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

                        <div className="flex justify-center md:pt-6">
                            <div className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-full">
                                <ArrowLeftRight className="text-gray-400" size={24} />
                            </div>
                        </div>

                        <div className="space-y-4 md:-mt-20"> {/* Negative margin to align with first col if stacked differently, simple grid logic here */}
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Almacén Destino (Hacia)</label>
                            <div className="relative">
                                <Factory className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
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

                    <div className="flex justify-end pt-4">
                        <button
                            disabled={!origen || !destino}
                            onClick={() => setStep(2)}
                            className="bg-lime-600 text-white px-6 py-2.5 rounded-lg hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            Siguiente: Seleccionar Insumos
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Selection */}
            {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Search & Available */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar insumo en origen..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden min-h-[400px]">
                            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                                <h3 className="font-medium text-gray-700 dark:text-gray-300">Disponible en Origen</h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {isSearching ? (
                                    <div className="p-8 text-center text-gray-400">Buscando...</div>
                                ) : stockResults.length > 0 ? (
                                    stockResults.map(item => (
                                        <div key={item.stockId} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 group">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{item.insumo.nombre}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.insumo.codigo}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{Number(item.cantidadActual)}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">{item.insumo.unidadMedida}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddItem(item)}
                                                    className="p-2 bg-lime-50 text-lime-600 rounded-lg hover:bg-lime-100 dark:bg-lime-900/20 dark:hover:bg-lime-900/40 transition-colors"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        {searchTerm.length > 0
                                            ? `No se encontraron insumos que coincidan con "${searchTerm}".`
                                            : "Use el buscador para encontrar insumos disponibles."
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Selected List */}
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 h-full flex flex-col">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                                <span>Por Trasladar</span>
                                <span className="text-xs bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full">{selectedItems.length}</span>
                            </h3>

                            <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                                {selectedItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-lg p-4">
                                        <ArrowLeftRight size={24} className="mb-2 opacity-20" />
                                        Seleccione ítems
                                    </div>
                                ) : (
                                    selectedItems.map(item => {
                                        const isError = item.cantidad <= 0 || item.cantidad > item.stockDisponible;
                                        return (
                                            <div key={item.insumoId} className={`bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg border ${isError ? 'border-red-300 dark:border-red-800' : 'border-gray-100 dark:border-zinc-700/50'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{item.nombre}</span>
                                                    <button onClick={() => handleDelete(item.insumoId)} className="text-gray-400 hover:text-red-500">
                                                        <Trash size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.stockDisponible}
                                                        value={item.cantidad}
                                                        onChange={(e) => handleUpdateQuantity(item.insumoId, Number(e.target.value))}
                                                        className={`w-20 px-2 py-1 text-sm border rounded bg-white dark:bg-zinc-700 outline-none ${isError
                                                                ? 'border-red-500 focus:ring-1 focus:ring-red-500 text-red-600'
                                                                : 'border-gray-300 dark:border-zinc-600 focus:ring-1 focus:ring-lime-500'
                                                            }`}
                                                    />
                                                    <span className="text-xs text-gray-500">{item.unidad}</span>
                                                    <span className={`text-[10px] ml-auto ${isError ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                        Max: {item.stockDisponible}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-2">
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={selectedItems.length === 0 || selectedItems.some(i => i.cantidad <= 0 || i.cantidad > i.stockDisponible)}
                                    className="w-full bg-lime-600 text-white py-2.5 rounded-lg hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                >
                                    Revisar y Confirmar
                                </button>
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    Atrás
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
                <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Confirmar Traslado</h3>

                    <div className="flex items-center gap-4 mb-8 bg-lime-50 dark:bg-lime-900/20 p-4 rounded-lg border border-lime-100 dark:border-lime-800/50">
                        <div className="text-center flex-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Origen</div>
                            <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                {almacenes.find(a => a.almacenId === origen)?.nombre}
                            </div>
                        </div>
                        <ArrowLeftRight className="text-lime-500" />
                        <div className="text-center flex-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Destino</div>
                            <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                {almacenes.find(a => a.almacenId === destino)?.nombre}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-100 dark:border-zinc-800">Ítems a Mover</h4>
                        {selectedItems.map(item => (
                            <div key={item.insumoId} className="flex justify-between items-center py-2">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{item.nombre}</div>
                                    <div className="text-xs text-gray-500 font-mono">{item.codigo}</div>
                                </div>
                                <div className="font-mono font-medium">
                                    {item.cantidad} <span className="text-gray-500 text-sm">{item.unidad}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg dark:text-gray-400 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Volver
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 bg-lime-600 text-white py-3 rounded-lg hover:bg-lime-700 transition-colors font-medium shadow-sm disabled:opacity-70 flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? "Procesando..." : "Confirmar Traslado"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
