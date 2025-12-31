"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Users, Save } from "lucide-react";

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
    const [formData, setFormData] = useState<Provider>({
        nombre: "",
        rifNif: "",
        telefono: "",
        correo: "",
        direccion: "",
        activo: true
    });

    // Split state for RIF and Phone
    const [rifPrefix, setRifPrefix] = useState("J");
    const [rifValue, setRifValue] = useState("");
    const [phonePrefix, setPhonePrefix] = useState("0412");
    const [phoneValue, setPhoneValue] = useState("");

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (provider) {
                setFormData(provider);

                // Parse RIF
                if (provider.rifNif && provider.rifNif.includes("-")) {
                    const [p, ...v] = provider.rifNif.split("-");
                    setRifPrefix(p);
                    setRifValue(v.join("-"));
                } else if (provider.rifNif) {
                    // Fallback if no hyphen
                    setRifValue(provider.rifNif);
                } else {
                    setRifPrefix("J");
                    setRifValue("");
                }

                // Parse Phone
                // Assumed format: 0412-1234567 or 04121234567. We'll try to match known prefixes.
                if (provider.telefono) {
                    const cleanPhone = provider.telefono.replace(/-/g, "");
                    const knownPrefixes = ["0412", "0414", "0424", "0416", "0426", "0212"];
                    const matchedPrefix = knownPrefixes.find(p => cleanPhone.startsWith(p));

                    if (matchedPrefix) {
                        setPhonePrefix(matchedPrefix);
                        setPhoneValue(cleanPhone.substring(matchedPrefix.length));
                    } else {
                        setPhoneValue(cleanPhone);
                    }
                } else {
                    setPhonePrefix("0412");
                    setPhoneValue("");
                }

            } else {
                // Reset for new creation
                setFormData({
                    nombre: "",
                    rifNif: "",
                    telefono: "",
                    correo: "",
                    direccion: "",
                    activo: true
                });
                setRifPrefix("J"); // Default for providers usually 'Juridico'
                setRifValue("");
                setPhonePrefix("0412");
                setPhoneValue("");
            }
        }
    }, [isOpen, provider]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Concatenate values
        const finalRif = `${rifPrefix}-${rifValue}`;
        const finalPhone = phoneValue ? `${phonePrefix}-${phoneValue}` : "";

        const payload = {
            ...formData,
            rifNif: finalRif,
            telefono: finalPhone
        };

        try {
            const url = provider?.proveedorId
                ? `/api/inventory/providers/${provider.proveedorId}`
                : "/api/inventory/providers";

            const method = provider?.proveedorId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={provider ? "Editar Proveedor" : "Nuevo Proveedor"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre / Razón Social *</label>
                    <input
                        required
                        type="text"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RIF Field with Prefix */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RIF / NIF</label>
                        <div className="flex gap-2">
                            <select
                                className="w-20 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-500"
                                value={rifPrefix}
                                onChange={e => setRifPrefix(e.target.value)}
                            >
                                <option value="J">J-</option>
                            </select>
                            <input
                                type="text"
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                value={rifValue}
                                onChange={e => setRifValue(e.target.value)}
                                placeholder="123456789"
                            />
                        </div>
                    </div>

                    {/* Phone Field with Prefix */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                        <div className="flex gap-2">
                            <select
                                className="w-24 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-500"
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
                                type="text"
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                value={phoneValue}
                                onChange={e => setPhoneValue(e.target.value.replace(/\D/g, ''))} // Only numbers
                                placeholder="1234567"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                    <input
                        type="email"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                        value={formData.correo || ""}
                        onChange={e => setFormData({ ...formData, correo: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                    <textarea
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                        value={formData.direccion || ""}
                        onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                    />
                </div>

                {provider && (
                    <div className="flex items-center gap-3 pt-2">
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="activo"
                                id="activo-toggle"
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6"
                                checked={formData.activo}
                                onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                            />
                            <label htmlFor="activo-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.activo ? 'bg-lime-500' : 'bg-gray-300 dark:bg-zinc-700'}`}></label>
                        </div>
                        <label htmlFor="activo-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            {formData.activo ? "Proveedor Activo" : "Proveedor Inactivo"}
                        </label>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                    <Button
                        variant="primary"
                        type="submit"
                        isLoading={isProcessing}
                        leftIcon={<Save size={18} />}
                    >
                        Guardar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
