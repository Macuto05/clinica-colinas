import { useState, useEffect } from "react";
import { Package, X, Check, Loader2, Factory, Info } from "lucide-react";
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
    cantidad: number;
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
            if (almacenes.length > 0) setSelectedAlmacenId(almacenes[0].almacenId);
        }
    }, [isOpen, pedido, almacenes]);

    const handleChange = (detalleId: string, field: keyof ItemReception, value: any) => {
        setItems(prev => ({ ...prev, [detalleId]: { ...prev[detalleId], [field]: value } }));
    };

    const handleConfirm = () => {
        if (!selectedAlmacenId) { alert("Por favor seleccione un almacén de recepción."); return; }
        const payload = Object.values(items).map(item => ({
            ...item,
            almacenId: selectedAlmacenId,
            fechaVencimiento: item.sinVencimiento ? null : item.fechaVencimiento
        }));
        onConfirm(pedido.pedidoId, payload);
    };

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
                        className="absolute inset-0 bg-black/50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-lime-100 rounded-lg text-lime-600 border border-lime-200">
                                    <Package size={15} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">
                                        Recepción de Pedido
                                    </h3>
                                    <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        ORDEN #{pedido.pedidoId}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-red-50 rounded-full transition-colors group">
                                <X size={16} className="text-gray-400 group-hover:text-red-500" />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-3"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {/* Info banner */}
                            <div className="bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl flex gap-2.5 items-center">
                                <Info className="text-gray-500 shrink-0" size={14} />
                                <p className="text-[11px] font-semibold text-gray-600 leading-snug">
                                    Asigne un <span className="font-black text-gray-800">código de lote</span>, fecha de fabricación y vencimiento (si aplica) para cada insumo recibido.
                                </p>
                            </div>

                            {/* Warehouse selector */}
                            <div className="bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">
                                    Almacén de Destino
                                </label>
                                <div className="relative">
                                    <Factory className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <select
                                        value={selectedAlmacenId}
                                        onChange={e => setSelectedAlmacenId(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white outline-none text-xs font-bold text-gray-800 appearance-none shadow-sm focus:ring-2 focus:ring-lime-400/40 cursor-pointer"
                                    >
                                        {almacenes.map(almacen => (
                                            <option key={almacen.almacenId} value={almacen.almacenId}>
                                                {almacen.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-0.5 flex items-center gap-1.5">
                                    <Package size={10} />
                                    Detalle de Insumos ({pedido.detalles?.length})
                                </p>
                                <div className="space-y-2">
                                    {pedido.detalles?.map((d: any) => {
                                        const itemState = items[d.detalleId] || {};
                                        const expInvalid = !itemState.sinVencimiento && itemState.fechaVencimiento && itemState.fechaFabricacion &&
                                            new Date(itemState.fechaVencimiento) <= new Date(itemState.fechaFabricacion);

                                        return (
                                            <div
                                                key={d.detalleId}
                                                className="border border-gray-200 rounded-xl bg-white overflow-hidden"
                                            >
                                                {/* Item header */}
                                                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-xs font-black text-gray-900 truncate uppercase">{d.insumo.nombre}</span>
                                                        <span className="text-[9px] font-mono text-gray-400 shrink-0">{d.insumo.codigo}</span>
                                                        {d.proveedor && (
                                                            <span className="text-[9px] font-black text-lime-700 bg-lime-50 border border-lime-200 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                                                                {d.proveedor.nombre}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest shrink-0 ml-2">
                                                        Solicitado: <span className="text-gray-800">{d.cantidad} {d.insumo.unidadMedida}</span>
                                                    </span>
                                                </div>

                                                {/* Item fields */}
                                                <div className="grid grid-cols-4 gap-2 p-3">
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Lote</label>
                                                        <input
                                                            type="text"
                                                            className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-lime-400/30 outline-none shadow-sm transition-colors"
                                                            placeholder="Ej: L2024-X"
                                                            value={itemState.loteCodigo || ""}
                                                            onChange={e => handleChange(d.detalleId, "loteCodigo", e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fabricación</label>
                                                        <input
                                                            type="date"
                                                            className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-lime-400/30 outline-none shadow-sm transition-colors"
                                                            value={itemState.fechaFabricacion || ""}
                                                            onChange={e => handleChange(d.detalleId, "fechaFabricacion", e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vencimiento</label>
                                                            <button
                                                                onClick={() => handleChange(d.detalleId, "sinVencimiento", !itemState.sinVencimiento)}
                                                                className={cn(
                                                                    "text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter transition-colors border",
                                                                    itemState.sinVencimiento
                                                                        ? "bg-gray-200 text-gray-600 border-gray-300"
                                                                        : "bg-white text-gray-400 border-gray-200"
                                                                )}
                                                            >
                                                                {itemState.sinVencimiento ? "TIENE" : "NO VENCE"}
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="date"
                                                            className={cn(
                                                                "w-full text-xs font-bold px-2 py-1.5 rounded-lg border outline-none shadow-sm transition-colors",
                                                                itemState.sinVencimiento
                                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                    : expInvalid
                                                                        ? 'border-rose-300 bg-rose-50 text-rose-600 focus:ring-2 focus:ring-rose-400/30'
                                                                        : 'border-gray-200 bg-white focus:ring-2 focus:ring-lime-400/30'
                                                            )}
                                                            value={itemState.fechaVencimiento || ""}
                                                            onChange={e => handleChange(d.detalleId, "fechaVencimiento", e.target.value)}
                                                            disabled={itemState.sinVencimiento}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cant. Recibida</label>
                                                        <input
                                                            type="number"
                                                            className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-lime-400/30 outline-none shadow-sm transition-colors"
                                                            value={itemState.cantidad || 0}
                                                            onChange={e => handleChange(d.detalleId, "cantidad", Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-white flex justify-end gap-2 shrink-0">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!isValid || isProcessing}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg active:scale-95",
                                    isValid && !isProcessing
                                        ? "bg-[#a1db4b] text-white hover:bg-[#8cc63f] shadow-lime-500/20"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                )}
                            >
                                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
                                {isProcessing ? "Procesando..." : "Confirmar Recepción"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
