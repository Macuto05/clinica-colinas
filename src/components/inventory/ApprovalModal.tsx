import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Check } from "lucide-react";

interface Supplier {
    proveedorId: string;
    nombre: string;
}

interface ApprovalModalProps {
    pedido: any;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pedidoId: string, assignments: { detalleId: string, proveedorId: string }[]) => Promise<void>;
    isProcessing: boolean;
}

export function ApprovalModal({ pedido, isOpen, onClose, onConfirm, isProcessing }: ApprovalModalProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [assignments, setAssignments] = useState<Record<string, string>>({});
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

    // Quick assign all
    const [bulkSupplier, setBulkSupplier] = useState<string>("");

    // New Provider Creation State
    const [isCreatingProvider, setIsCreatingProvider] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newProvider, setNewProvider] = useState({ nombre: "", rifNif: "" });

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            // Reset assignments
            setAssignments({});
            setBulkSupplier("");
            setIsCreatingProvider(false);
            setNewProvider({ nombre: "", rifNif: "" });
        }
    }, [isOpen]);

    const fetchSuppliers = async () => {
        setIsLoadingSuppliers(true);
        try {
            const res = await fetch("/api/inventory/providers");
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingSuppliers(false);
        }
    };

    const createProvider = async () => {
        setIsCreating(true);
        try {
            const res = await fetch("/api/inventory/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProvider)
            });
            if (res.ok) {
                const created = await res.json();
                setSuppliers([...suppliers, created]);
                setIsCreatingProvider(false);
                setNewProvider({ nombre: "", rifNif: "" });
                if (!bulkSupplier) setBulkSupplier(created.proveedorId);
            }
        } catch (error) {
            console.error("Error creating provider", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssign = (detalleId: string, proveedorId: string) => {
        setAssignments(prev => ({ ...prev, [detalleId]: proveedorId }));
    };

    const applyBulk = () => {
        if (!bulkSupplier) return;
        const newAssignments: Record<string, string> = {};
        pedido?.detalles.forEach((d: any) => {
            newAssignments[d.detalleId] = bulkSupplier;
        });
        setAssignments(newAssignments);
    };

    const handleConfirm = () => {
        const payload = Object.entries(assignments).map(([detalleId, proveedorId]) => ({
            detalleId,
            proveedorId
        }));
        onConfirm(pedido.pedidoId, payload);
    };

    const isComplete = pedido?.detalles.every((d: any) => assignments[d.detalleId]);

    if (!pedido) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Aprobar Pedido #${pedido.pedidoId}`}
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 text-sm text-yellow-800">
                    <AlertCircle className="shrink-0 h-5 w-5" />
                    <div>
                        <p className="font-semibold">Asignación de Proveedores Requerida</p>
                        <p>Para aprobar este pedido, debes indicar qué proveedor suministrará cada ítem.</p>
                    </div>
                </div>

                {/* New Supplier Toggle */}
                <div className="flex justify-end mb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreatingProvider(!isCreatingProvider)}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        {isCreatingProvider ? "Cancelar Crear Proveedor" : "+ Crear Nuevo Proveedor"}
                    </Button>
                </div>

                {isCreatingProvider && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 border border-blue-100 dark:border-blue-800">
                        <h4 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100">Nuevo Proveedor</h4>
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
                                <input
                                    className="w-full text-sm p-2 rounded border border-gray-300 dark:bg-zinc-900 dark:border-zinc-700 mt-1"
                                    placeholder="Ej: Droguería Americana"
                                    value={newProvider.nombre}
                                    onChange={e => setNewProvider({ ...newProvider, nombre: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">RIF/Documento</label>
                                <input
                                    className="w-full text-sm p-2 rounded border border-gray-300 dark:bg-zinc-900 dark:border-zinc-700 mt-1"
                                    placeholder="J-12345678-9"
                                    value={newProvider.rifNif}
                                    onChange={e => setNewProvider({ ...newProvider, rifNif: e.target.value })}
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-end mt-2">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={!newProvider.nombre || isCreating}
                                    onClick={createProvider}
                                    isLoading={isCreating}
                                >
                                    Guardar Proveedor
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700">
                    <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Asignación Masiva</label>
                        <select
                            className="w-full text-sm p-2 rounded border border-gray-300 dark:border-zinc-600 dark:bg-zinc-900"
                            value={bulkSupplier}
                            onChange={(e) => setBulkSupplier(e.target.value)}
                        >
                            <option value="">-- Seleccionar Proveedor para todos --</option>
                            {suppliers.map(s => (
                                <option key={s.proveedorId} value={s.proveedorId}>{s.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <Button size="sm" variant="secondary" onClick={applyBulk} disabled={!bulkSupplier}>
                        Aplicar a Todo
                    </Button>
                </div>

                <table className="w-full text-sm">
                    <thead className="text-left text-gray-500 border-b">
                        <tr>
                            <th className="pb-2">Insumo</th>
                            <th className="pb-2">Cantidad</th>
                            <th className="pb-2 w-1/3">Proveedor Asignado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {pedido.detalles.map((d: any) => (
                            <tr key={d.detalleId}>
                                <td className="py-3 pr-2">
                                    <div className="font-medium">{d.insumo.nombre}</div>
                                    <div className="text-xs text-gray-400">{d.insumo.codigo}</div>
                                </td>
                                <td className="py-3">
                                    {d.cantidad} {d.insumo.unidadMedida}
                                </td>
                                <td className="py-3">
                                    <select
                                        className={`w-full p-2 rounded border ${!assignments[d.detalleId] ? 'border-red-300 bg-red-50' : 'border-gray-300 dark:border-zinc-600 dark:bg-zinc-900'}`}
                                        value={assignments[d.detalleId] || ""}
                                        onChange={(e) => handleAssign(d.detalleId, e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {suppliers.map(s => (
                                            <option key={s.proveedorId} value={s.proveedorId}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!isComplete || isProcessing}
                        isLoading={isProcessing}
                        leftIcon={<Check size={16} />}
                    >
                        Confirmar y Aprobar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
