import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Calendar as CalendarIcon, Package } from "lucide-react";

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
    // Validate that all items have Batch Code and Expiry Date (unless disabled)
    // AND Expiry Date > Manufacturing Date (if both present)
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Recepción de Pedido #${pedido.pedidoId}`}
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
                    <Package className="shrink-0 h-5 w-5" />
                    <div>
                        <p className="font-semibold">Registro de Recepción</p>
                        <p>Seleccione el almacén de destino e ingrese el código de lote y la fecha de vencimiento (si aplica) de cada producto.</p>
                    </div>
                </div>

                {/* Warehouse Selector */}
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-100 dark:border-zinc-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Almacén de Recepción
                    </label>
                    <select
                        value={selectedAlmacenId}
                        onChange={(e) => setSelectedAlmacenId(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-lime-500 outline-none"
                    >
                        {almacenes.map(almacen => (
                            <option key={almacen.almacenId} value={almacen.almacenId}>
                                {almacen.nombre}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Todos los insumos de este pedido serán ingresados a este almacén.
                    </p>
                </div>

                <div className="space-y-4">
                    {pedido.detalles?.map((d: any) => {
                        const itemState = items[d.detalleId] || {};
                        return (
                            <div key={d.detalleId} className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100">{d.insumo.nombre}</h4>
                                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                            COD: {d.insumo.codigo}
                                        </span>
                                        {d.proveedor && (
                                            <div className="text-xs text-blue-600 mt-1">
                                                Prov: {d.proveedor.nombre}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-500">Solicitado</div>
                                        <div className="text-lg font-bold">{d.cantidad} <span className="text-xs font-normal">{d.insumo.unidadMedida}</span></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    {/* Lote Code */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Lote (Código)
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full text-sm p-2 rounded border border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ej: L-2024-X"
                                            value={itemState.loteCodigo || ""}
                                            onChange={(e) => handleChange(d.detalleId, "loteCodigo", e.target.value)}
                                        />
                                    </div>

                                    {/* Manufacturing Date */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Fabricación
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full text-sm p-2 rounded border border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500"
                                            value={itemState.fechaFabricacion || ""}
                                            onChange={(e) => handleChange(d.detalleId, "fechaFabricacion", e.target.value)}
                                        />
                                    </div>

                                    {/* Expiration Date */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Vencimiento
                                            </label>
                                            <button
                                                onClick={() => handleChange(d.detalleId, "sinVencimiento", !itemState.sinVencimiento)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border ${itemState.sinVencimiento ? 'bg-gray-200 text-gray-600 border-gray-300 dark:bg-zinc-700 dark:text-gray-300 dark:border-zinc-600' : 'bg-transparent text-gray-400 border-transparent hover:border-gray-300'}`}
                                                title={itemState.sinVencimiento ? "Habilitar fecha" : "Marcar como sin vencimiento"}
                                            >
                                                {itemState.sinVencimiento ? "No Vence" : "No Vence?"}
                                            </button>
                                        </div>
                                        <input
                                            type="date"
                                            className={`w-full text-sm p-2 rounded border focus:ring-2 focus:ring-blue-500 ${itemState.sinVencimiento
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-zinc-800/50 dark:border-zinc-700'
                                                : !itemState.sinVencimiento && itemState.fechaVencimiento && itemState.fechaFabricacion && new Date(itemState.fechaVencimiento) <= new Date(itemState.fechaFabricacion)
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
                                                    : 'border-gray-300 dark:bg-zinc-800 dark:border-zinc-700'
                                                }`}
                                            value={itemState.fechaVencimiento || ""}
                                            onChange={(e) => handleChange(d.detalleId, "fechaVencimiento", e.target.value)}
                                            disabled={itemState.sinVencimiento}
                                        />
                                        {!itemState.sinVencimiento && itemState.fechaVencimiento && itemState.fechaFabricacion && new Date(itemState.fechaVencimiento) <= new Date(itemState.fechaFabricacion) && (
                                            <p className="text-[10px] text-red-500 mt-1">
                                                Vencimiento debe ser mayor a fabricación
                                            </p>
                                        )}
                                    </div>

                                    {/* Received Quantity */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Cant. Recibida
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full text-sm p-2 rounded border border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500"
                                            value={itemState.cantidad || 0}
                                            onChange={(e) => handleChange(d.detalleId, "cantidad", Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!isValid || isProcessing}
                        isLoading={isProcessing}
                        leftIcon={<Package size={16} />}
                    >
                        Confirmar Recepción
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
