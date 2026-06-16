"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";

interface Provider {
    proveedorId?: string;
    nombre: string;
    rifNif: string;
    telefono: string;
    correo: string;
    direccion: string;
    activo: boolean;
}

interface ProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider?: Provider | null;
    onSave: () => void;
}

export function ProviderModal({ isOpen, onClose, provider, onSave }: ProviderModalProps) {
    const [formData, setFormData] = useState({ nombre: "", correo: "", direccion: "", activo: true });
    const [rifValue, setRifValue] = useState("");
    const [phonePrefix, setPhonePrefix] = useState("0412");
    const [phoneValue, setPhoneValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        setFieldErrors({});

        if (provider) {
            setFormData({ nombre: provider.nombre, correo: provider.correo, direccion: provider.direccion, activo: provider.activo });

            if (provider.rifNif?.startsWith("J-")) {
                setRifValue(provider.rifNif.slice(2));
            } else {
                setRifValue(provider.rifNif || "");
            }

            if (provider.telefono) {
                const clean = provider.telefono.replace(/-/g, "");
                const prefixes = ["0412", "0422", "0414", "0424", "0416", "0426"];
                const match = prefixes.find(p => clean.startsWith(p));
                if (match) { setPhonePrefix(match); setPhoneValue(clean.slice(match.length)); }
                else { setPhonePrefix("0412"); setPhoneValue(clean); }
            } else {
                setPhonePrefix("0412");
                setPhoneValue("");
            }
        } else {
            setFormData({ nombre: "", correo: "", direccion: "", activo: true });
            setRifValue("");
            setPhonePrefix("0412");
            setPhoneValue("");
        }
    }, [isOpen, provider]);

    const clearError = (field: string) =>
        setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setFieldErrors({});

        const payload = {
            ...formData,
            rifNif: `J-${rifValue}`,
            telefono: phoneValue ? `${phonePrefix}-${phoneValue}` : "",
        };

        try {
            const url = provider?.proveedorId
                ? `/api/inventory/providers/${provider.proveedorId}`
                : "/api/inventory/providers";
            const method = provider?.proveedorId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                const data = await res.json().catch(() => ({}));
                if (res.status === 409 && data.field) {
                    setFieldErrors({ [data.field]: data.error });
                } else {
                    setFieldErrors({ general: data.error || "Error al guardar proveedor" });
                }
            }
        } catch {
            setFieldErrors({ general: "Error de conexión" });
        } finally {
            setIsProcessing(false);
        }
    };

    const inputCls = (field: string) =>
        `w-full px-5 py-3.5 rounded-2xl focus:bg-white/80 focus:ring-2 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${
            fieldErrors[field]
                ? "border border-red-400 bg-red-50/30 focus:ring-red-400/50"
                : "border border-white/60 bg-white/50 focus:ring-lime-500/50"
        }`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={provider ? "Editar Proveedor" : "Nuevo Proveedor"}>
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Nombre */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Nombre / Razón Social</label>
                    <input
                        required
                        type="text"
                        className={inputCls("nombre")}
                        value={formData.nombre}
                        onChange={e => { setFormData(p => ({ ...p, nombre: e.target.value })); clearError("nombre"); }}
                        placeholder="Ej: Distribuidora Médica S.A."
                    />
                    {fieldErrors.nombre && <p className="text-xs text-red-500 font-medium px-1">{fieldErrors.nombre}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* RIF */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">RIF / NIF</label>
                        <div className="flex gap-2">
                            <span className="flex items-center px-4 py-3.5 rounded-2xl bg-white/30 border border-white/60 text-sm font-black text-gray-600 select-none">
                                J-
                            </span>
                            <input
                                required
                                type="text"
                                className={`flex-1 px-5 py-3.5 rounded-2xl focus:bg-white/80 focus:ring-2 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${
                                    fieldErrors.rifNif
                                        ? "border border-red-400 bg-red-50/30 focus:ring-red-400/50"
                                        : "border border-white/60 bg-white/50 focus:ring-lime-500/50"
                                }`}
                                value={rifValue}
                                onChange={e => { setRifValue(e.target.value.replace(/\D/g, "")); clearError("rifNif"); }}
                                placeholder="123456789"
                            />
                        </div>
                        {fieldErrors.rifNif && <p className="text-xs text-red-500 font-medium px-1">{fieldErrors.rifNif}</p>}
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Teléfono</label>
                        <div className="flex gap-2">
                            <select
                                className="rounded-2xl border border-white/60 bg-white/50 px-3 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-lime-500/50 appearance-none cursor-pointer"
                                value={phonePrefix}
                                onChange={e => setPhonePrefix(e.target.value)}
                            >
                                <option value="0412">0412</option>
                                <option value="0422">0422</option>
                                <option value="0414">0414</option>
                                <option value="0424">0424</option>
                                <option value="0416">0416</option>
                                <option value="0426">0426</option>
                            </select>
                            <input
                                required
                                type="text"
                                maxLength={7}
                                className={`flex-1 px-5 py-3.5 rounded-2xl focus:bg-white/80 focus:ring-2 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${
                                    fieldErrors.telefono
                                        ? "border border-red-400 bg-red-50/30 focus:ring-red-400/50"
                                        : "border border-white/60 bg-white/50 focus:ring-lime-500/50"
                                }`}
                                value={phoneValue}
                                onChange={e => { setPhoneValue(e.target.value.replace(/\D/g, "")); clearError("telefono"); }}
                                placeholder="1234567"
                            />
                        </div>
                        {fieldErrors.telefono && <p className="text-xs text-red-500 font-medium px-1">{fieldErrors.telefono}</p>}
                    </div>
                </div>

                {/* Correo */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Correo Electrónico</label>
                    <input
                        required
                        type="email"
                        className={inputCls("correo")}
                        value={formData.correo}
                        onChange={e => { setFormData(p => ({ ...p, correo: e.target.value })); clearError("correo"); }}
                        placeholder="contacto@proveedor.com"
                    />
                    {fieldErrors.correo && <p className="text-xs text-red-500 font-medium px-1">{fieldErrors.correo}</p>}
                </div>

                {/* Dirección */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Dirección</label>
                    <textarea
                        required
                        rows={2}
                        className="w-full px-5 py-3.5 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 resize-none"
                        value={formData.direccion}
                        onChange={e => setFormData(p => ({ ...p, direccion: e.target.value }))}
                        placeholder="Dirección completa del proveedor..."
                    />
                </div>

                {/* Toggle activo (solo edición) */}
                {provider && (
                    <div className="flex items-center gap-3 pt-1">
                        <div
                            className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${formData.activo ? "bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.4)]" : "bg-gray-200"}`}
                            onClick={() => setFormData(p => ({ ...p, activo: !p.activo }))}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${formData.activo ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => setFormData(p => ({ ...p, activo: !p.activo }))}>
                            {formData.activo ? "Proveedor Activo" : "Proveedor Inactivo"}
                        </span>
                    </div>
                )}

                {fieldErrors.general && (
                    <p className="text-xs text-red-500 font-medium text-center bg-red-50/50 rounded-xl py-2 px-3">
                        {fieldErrors.general}
                    </p>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/40">
                    <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                    <Button variant="primary" type="submit" isLoading={isProcessing} leftIcon={<Save size={18} />}>
                        Guardar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
