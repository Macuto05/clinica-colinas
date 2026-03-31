import { useState, useEffect } from "react";
import { AlertTriangle, Calendar as CalendarIcon, Package, X, Check, Loader2, Factory, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ReceivingModalProps {
    pedido: any;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pedidoId: string, receivedItems: any[]) => Promise<void>;
    isProcessing: boolean;
    almacenes: { almacenId: string; nombre: string }[];
}

interface ItemReception {
    detalleId: string;
    insumoId: string;
    cantidad: number; // Cantidad recibida real
    loteCodigo: string;
    fechaVencimiento: string;
    fechaFabricacion: string;
    almacenId?: string;
    sinVencimiento: boolean;
}

export function ReceivingModal({ pedido, isOpen, onClose, onConfirm, isProcessing, almacenes }: ReceivingModalProps) {
    const [items, setItems] = useState<Record<string, ItemReception>>({});
    const [selectedAlmacenId, setSelectedAlmacenId] = useState<string>("");

    useEffect(() => {
        if (isOpen && pedido) {
            // Initialize state with default values from the order
            const initialItems: Record<string, ItemReception> = {};
            pedido.detalles.forEach((d: any) => {
                initialItems[d.detalleId] = {
                    detalleId: d.detalleId,
                    insumoId: d.insumoId,
                    cantidad: Number(d.cantidad),
                    loteCodigo: "",
                    fechaVencimiento: "",
                    fechaFabricacion: "",
                    sinVencimiento: false
                };
            });
            setItems(initialItems);

            // Set default warehouse logic
            if (almacenes.length > 0) {
                setSelectedAlmacenId(almacenes[0].almacenId);
            }
        }
    }, [isOpen, pedido, almacenes]);

    const handleChange = (detalleId: string, field: keyof ItemReception, value: any) => {
        setItems(prev => ({
            ...prev,
            [detalleId]: { ...prev[detalleId], [field]: value }
        }));
    };

    const handleConfirm = () => {
        if (!selectedAlmacenId) {
            alert("Por favor seleccione un almacén de recepción.");
            return;
        }
        // Inject selectedAlmacenId into every item
        const payload = Object.values(items).map(item => ({
            ...item,
            almacenId: selectedAlmacenId,
            fechaVencimiento: item.sinVencimiento ? null : item.fechaVencimiento
        }));
        onConfirm(pedido.pedidoId, payload);
    };

    // Validate that all items have Batch Code and Expiry Date (unless disabled)
    const isValid = Object.values(items).every(item =>
        item.loteCodigo &&
        (item.sinVencimiento || (
            item.fechaVencimiento &&
            (!item.fechaFabricacion || new Date(item.fechaVencimiento) > new Date(item.fechaFabricacion))
        )) &&
        item.cantidad > 0
    ) && !!selectedAlmacenId;

    if (!pedido) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[2.5rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/60 flex justify-between items-center bg-white/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-lime-500/10 rounded-2xl text-lime-600 shadow-sm border border-lime-200/50">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">Recepción de Pedido</h3>
                                    <p className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest mt-0.5">ORDEN #{pedido.pedidoId}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200/50 rounded-full transition-colors group"
                            >
                                <X size={20} className="text-gray-400 group-hover:text-gray-900" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="bg-[#1e293b]/5 backdrop-blur-md border border-white/50 p-6 rounded-[2rem] flex gap-4 text-xs">
                                <Info className="shrink-0 h-5 w-5 text-gray-600" />
                                <div className="space-y-1">
                                    <p className="font-black text-gray-900 uppercase tracking-widest">Información de Entrada</p>
                                    <p className="text-gray-500 font-medium leading-relaxed">Asigne un código de lote, fecha de fabricación y vencimiento (si aplica) para cada insumo recibido.</p>
                                </div>
                            </div>

                            {/* Warehouse Selector */}
                            <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/50 shadow-sm">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block ml-2">
                                    Almacén de Destino
                                </label>
                                <div className="relative group">
                                    <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-600 transition-colors" size={20} />
                                    <select
                                        value={selectedAlmacenId}
                                        onChange={(e) => setSelectedAlmacenId(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 appearance-none shadow-sm transition-all"
                                    >
                                        {almacenes.map(almacen => (
                                            <option key={almacen.almacenId} value={almacen.almacenId}>
                                                {almacen.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4 pb-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                    <Package size={14} />
                                    Detalle de Insumos ({pedido.detalles?.length})
                                </h4>
                                {pedido.detalles?.map((d: any) => {
                                    const itemState = items[d.detalleId] || {};
                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={d.detalleId} 
                                            className="p-8 bg-white/40 backdrop-blur-md border border-white/50 rounded-[2rem] shadow-sm group hover:border-lime-400/50 transition-all"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                                                <div>
                                                    <h4 className="text-lg font-black text-gray-900 tracking-tight uppercase">{d.insumo.nombre}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-mono text-gray-400 bg-white/50 px-2 py-0.5 rounded-lg border border-white/80">
                                                            {d.insumo.codigo}
                                                        </span>
                                                        {d.proveedor && (
                                                            <span className="text-[10px] font-black text-lime-600 bg-lime-500/10 px-2 py-0.5 rounded-lg border border-lime-200/50 uppercase tracking-widest">
                                                                {d.proveedor.nombre}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right bg-white/50 p-3 px-6 rounded-2xl border border-white shadow-inner">
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Solicitado</div>
                                                    <div className="text-xl font-black text-gray-900 tracking-tight">{d.cantidad} <span className="text-[10px] uppercase font-bold text-gray-500">{d.insumo.unidadMedida}</span></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Lote (Código)</label>
                                                    <input
                                                        type="text"
                                                        className="w-full text-sm font-bold p-3 rounded-xl border border-white focus:bg-white focus:ring-4 focus:ring-lime-500/10 outline-none shadow-sm transition-all"
                                                        placeholder="Ej: L2024-X"
                                                        value={itemState.loteCodigo || ""}
                                                        onChange={(e) => handleChange(d.detalleId, "loteCodigo", e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fabricación</label>
                                                    <input
                                                        type="date"
                                                        className="w-full text-sm font-bold p-3 rounded-xl border border-white focus:bg-white focus:ring-4 focus:ring-lime-500/10 outline-none shadow-sm transition-all"
                                                        value={itemState.fechaFabricacion || ""}
                                                        onChange={(e) => handleChange(d.detalleId, "fechaFabricacion", e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vencimiento</label>
                                                        <button
                                                            onClick={() => handleChange(d.detalleId, "sinVencimiento", !itemState.sinVencimiento)}
                                                            className={cn(
                                                                "text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter transition-all",
                                                                itemState.sinVencimiento ? "bg-gray-200 text-gray-600" : "bg-white/50 text-gray-400 border border-white/80"
                                                            )}
                                                        >
                                                            {itemState.sinVencimiento ? "TIENE" : "NO VENCE"}
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        className={cn(
                                                            "w-full text-sm font-bold p-3 rounded-xl border outline-none shadow-sm transition-all",
                                                            itemState.sinVencimiento
                                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                : !itemState.sinVencimiento && itemState.fechaVencimiento && itemState.fechaFabricacion && new Date(itemState.fechaVencimiento) <= new Date(itemState.fechaFabricacion)
                                                                    ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500/10 text-rose-600'
                                                                    : 'border-white focus:bg-white focus:ring-4 focus:ring-lime-500/10'
                                                        )}
                                                        value={itemState.fechaVencimiento || ""}
                                                        onChange={(e) => handleChange(d.detalleId, "fechaVencimiento", e.target.value)}
                                                        disabled={itemState.sinVencimiento}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cant. Recibida</label>
                                                    <input
                                                        type="number"
                                                        className="w-full text-sm font-bold p-3 rounded-xl border border-white focus:bg-white focus:ring-4 focus:ring-lime-500/10 outline-none shadow-sm transition-all"
                                                        value={itemState.cantidad || 0}
                                                        onChange={(e) => handleChange(d.detalleId, "cantidad", Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-white/60 flex justify-end gap-4 bg-white/50 backdrop-blur-md">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="px-8 py-4 rounded-[1.5rem] font-bold text-gray-500 hover:bg-gray-200/50 transition-all uppercase tracking-widest text-[10px]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!isValid || isProcessing}
                                className={cn(
                                    "px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 shadow-lg active:scale-95 shadow-lime-500/20",
                                    isValid && !isProcessing ? "bg-[#a1db4b] text-white hover:bg-[#8cc63f]" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                )}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={3} />}
                                {isProcessing ? "Procesando..." : "Confirmar Recepción"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
