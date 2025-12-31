import { Modal } from "@/components/ui/Modal";
import { AlertOctagon, Calendar, Package } from "lucide-react";

interface ExpiringBatchesModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: any[];
}

export function ExpiringBatchesModal({ isOpen, onClose, items }: ExpiringBatchesModalProps) {
    const getDaysRemaining = (dateStr: string) => {
        const today = new Date();
        const expiry = new Date(dateStr);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Lotes por Vencer (Próximos 3 Meses)"
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No hay lotes próximos a vencer.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item, idx) => {
                            const days = getDaysRemaining(item.fechaVencimiento);
                            const isExpired = days < 0;

                            return (
                                <div key={idx} className={`p-4 rounded-lg border flex items-start justify-between gap-4 ${isExpired ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-900/30'}`}>
                                    <div className="flex gap-3">
                                        <div className={`mt-1 p-2 rounded-lg ${isExpired ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                            <AlertOctagon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.insumo.nombre}</h4>
                                            <p className="text-xs text-gray-500 mb-1">{item.insumo.codigo}</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                    <Package size={12} />
                                                    Lote: <span className="font-mono font-medium">{item.codigo}</span>
                                                </span>
                                                <span className="text-gray-400">|</span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {item.almacen.nombre}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className={`text-sm font-bold ${isExpired ? 'text-red-700' : 'text-orange-700'}`}>
                                            {item.cantidad} {item.insumo.unidadMedida}
                                        </div>
                                        <div className={`text-xs mt-1 font-medium flex items-center justify-end gap-1 ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                                            <Calendar size={12} />
                                            {new Date(item.fechaVencimiento).toLocaleDateString()}
                                        </div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-1 ${isExpired ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {isExpired ? `Vencido hace ${Math.abs(days)} días` : `Vence en ${days} días`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300"
                >
                    Cerrar
                </button>
            </div>
        </Modal>
    );
}
