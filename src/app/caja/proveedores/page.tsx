"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Search, MoreVertical, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProviderModal } from "@/components/caja/ProviderModal";

interface Provider {
    proveedorId: string;
    nombre: string;
    rifNif: string;
    telefono: string;
    correo: string;
    direccion: string;
    activo: boolean;
}

export default function ProvidersPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

    // Initial filter state: 'all' to show both active and inactive for management
    const fetchProviders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/inventory/providers?active=all");
            if (res.ok) {
                const data = await res.json();
                setProviders(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleCreate = () => {
        setSelectedProvider(null);
        setModalOpen(true);
    };

    const handleEdit = (provider: Provider) => {
        setSelectedProvider(provider);
        setModalOpen(true);
    };

    const handleToggleStatus = async (provider: Provider) => {
        if (!confirm(`¿Estás seguro de que deseas ${provider.activo ? 'desactivar' : 'reactivar'} a ${provider.nombre}?`)) return;

        try {
            const res = await fetch(`/api/inventory/providers/${provider.proveedorId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activo: !provider.activo })
            });

            if (res.ok) {
                fetchProviders();
            } else {
                alert("Error al actualizar estado");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
    };

    const filteredProviders = providers.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.rifNif && p.rifNif.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                        <Users className="text-lime-600 drop-shadow-sm" />
                        Gestión de Proveedores
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">Administra el catálogo de proveedores de la clínica.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-lime-500/95 hover:bg-lime-500 text-white font-bold shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 transition-colors text-sm"
                >
                    <Plus size={18} />
                    Nuevo Proveedor
                </button>
            </div>

            <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por Nombre o RIF..."
                        className="w-full pl-11 pr-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-visible bg-white/40 backdrop-blur-md rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <table className="w-full text-left">
                    <thead className="bg-white/30 border-b border-white/40 text-xs font-bold text-gray-500/80 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Nombre / Razón Social</th>
                            <th className="px-6 py-4 font-bold">RIF/NIF</th>
                            <th className="px-6 py-4 font-bold">Contacto</th>
                            <th className="px-6 py-4 font-bold">Estado</th>
                            <th className="px-6 py-4 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/30">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">Cargando...</td></tr>
                        ) : filteredProviders.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium italic">No se encontraron proveedores.</td></tr>
                        ) : filteredProviders.map(provider => (
                            <ProviderRow key={provider.proveedorId} provider={provider} onEdit={handleEdit} />
                        ))}
                    </tbody>
                </table>
            </div>

            <ProviderModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                provider={selectedProvider}
                onSave={fetchProviders}
            />
        </div>
    );
}

function ProviderRow({ provider, onEdit }: { provider: Provider, onEdit: (p: Provider) => void }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <tr className="hover:bg-white/60 transition-colors border-b border-white/30 last:border-0 group">
            <td className="px-6 py-5 font-bold text-gray-900 text-sm">
                {provider.nombre}
                <div className="text-xs text-gray-500 font-medium mt-0.5">{provider.direccion}</div>
            </td>
            <td className="px-6 py-5 font-mono text-xs text-gray-600 font-bold">{provider.rifNif || "-"}</td>
            <td className="px-6 py-5 text-sm font-medium">
                <div className="text-gray-700">{provider.telefono || "-"}</div>
                <div className="text-blue-600/80">{provider.correo || ""}</div>
            </td>
            <td className="px-6 py-5">
                <span className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 shadow-sm border ${provider.activo ? 'bg-green-500/20 text-green-800 border-green-200/50' : 'bg-gray-500/20 text-gray-800 border-gray-200/50'}`}>
                    {provider.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td className="px-6 py-5 text-right relative">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    suppressHydrationWarning={true}
                    className="text-gray-400 hover:text-lime-600 p-2 rounded-xl hover:bg-white/60 transition-all backdrop-blur-sm"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>

                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                        <div className="absolute right-6 top-12 z-50 min-w-[160px] bg-white/70 backdrop-blur-xl backdrop-saturate-[1.2] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 p-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => {
                                        onEdit(provider);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm font-bold text-gray-700 hover:bg-white/60 hover:text-gray-900 transition-colors flex items-center gap-2 rounded-xl"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar Proveedor
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </td>
        </tr>
    );
}
