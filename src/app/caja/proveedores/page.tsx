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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="text-lime-600" />
                        Gestión de Proveedores
                    </h1>
                    <p className="text-gray-500 text-sm">Administra el catálogo de proveedores de la clínica.</p>
                </div>
                <Button onClick={handleCreate} leftIcon={<Plus size={18} />} variant="primary">
                    Nuevo Proveedor
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por Nombre o RIF..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Nombre / Razón Social</th>
                            <th className="px-6 py-3 font-semibold">RIF/NIF</th>
                            <th className="px-6 py-3 font-semibold">Contacto</th>
                            <th className="px-6 py-3 font-semibold">Estado</th>
                            <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 border-t border-gray-200 dark:border-zinc-800">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
                        ) : filteredProviders.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No se encontraron proveedores.</td></tr>
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
        <tr className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                {provider.nombre}
                <div className="text-xs text-gray-400 font-normal">{provider.direccion}</div>
            </td>
            <td className="px-6 py-4 font-mono text-xs">{provider.rifNif || "-"}</td>
            <td className="px-6 py-4 text-xs">
                <div>{provider.telefono || "-"}</div>
                <div className="text-blue-500">{provider.correo || ""}</div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${provider.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {provider.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td className="px-6 py-4 text-right relative">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    suppressHydrationWarning={true}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>

                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                        <div className="absolute right-0 top-12 z-50 mt-0 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700 animate-in fade-in zoom-in-95 duration-100">
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        onEdit(provider);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
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
