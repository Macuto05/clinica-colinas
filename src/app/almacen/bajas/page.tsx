"use client";

import { useState, useEffect } from "react";
import { PackageX, Printer, Loader2, CalendarDays, AlertCircle, Archive, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
    { value: 1, label: "Enero" }, { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" }, { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" }, { value: 6, label: "Junio" },
    { value: 7, label: "Julio" }, { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" }, { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" }, { value: 12, label: "Diciembre" },
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear];
const ITEMS_PER_PAGE = 5;

interface BajaRow {
    fecha: string;
    referencia: string;
    almacen: string;
    insumo: string;
    codigo: string;
    lote: string;
    fechaVencimiento: string | null;
    cantidad: number;
    unidad: string;
    usuario: string;
}

export default function BajasPage() {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [rows, setRows] = useState<BajaRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        fetchBajas();
        setCurrentPage(1);
    }, [month, year]);

    const fetchBajas = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

            const res = await fetch(
                `/api/inventory/movements?tipo=AJUSTE&motivo=VENCIMIENTO&startDate=${startDate}&endDate=${endDate}&limit=500`
            );

            if (!res.ok) {
                setError("Error al cargar el reporte.");
                return;
            }

            const data = await res.json();

            const flattened: BajaRow[] = data.flatMap((mov: any) =>
                mov.detalles.map((det: any) => ({
                    fecha: mov.fechaMovimiento,
                    referencia: mov.referencia || "—",
                    almacen: mov.almacen?.nombre || "—",
                    insumo: det.insumo?.nombre || "—",
                    codigo: det.insumo?.codigo || "—",
                    lote: det.lote?.codigo || "—",
                    fechaVencimiento: det.lote?.fechaVencimiento || null,
                    cantidad: Number(det.cantidad),
                    unidad: det.insumo?.unidadMedida || "UND",
                    usuario: mov.usuario?.empleado
                        ? `${mov.usuario.empleado.nombres} ${mov.usuario.empleado.apellidos}`
                        : mov.usuario?.email || "—",
                }))
            );

            setRows(flattened);
        } catch {
            setError("Error de conexión.");
        } finally {
            setIsLoading(false);
        }
    };

    const totalUnidades = rows.reduce((sum, r) => sum + r.cantidad, 0);
    const monthLabel = MONTHS.find(m => m.value === month)?.label;

    const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
    const paginatedRows = rows.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // When printing, expand to all rows so the report is complete
    const handlePrint = () => {
        setIsPrinting(true);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            window.print();
            setIsPrinting(false);
        }));
    };

    const displayRows = isPrinting ? rows : paginatedRows;

    const renderTable = () => (
        <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
                <thead>
                    <tr className="bg-white/30 border-b border-white/40 print:bg-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Fecha</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Insumo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Lote</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Vencimiento</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Almacén</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest text-right">Cantidad</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Responsable</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/30">
                    {displayRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/60 transition-all duration-200 print:hover:bg-transparent">
                            <td className="px-6 py-4 text-xs font-bold text-gray-600 whitespace-nowrap">
                                {new Date(row.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{row.insumo}</div>
                                <div className="text-[10px] font-mono text-gray-400 mt-0.5">{row.codigo}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-mono text-xs bg-white/50 px-2 py-0.5 rounded border border-white/60 text-gray-600 font-bold">
                                    {row.lote}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-rose-600 whitespace-nowrap">
                                {row.fechaVencimiento
                                    ? new Date(row.fechaVencimiento).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
                                    : "—"}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-600">{row.almacen}</td>
                            <td className="px-6 py-4 text-right">
                                <span className="text-lg font-black text-rose-700">{row.cantidad}</span>
                                <div className="text-[10px] font-black text-gray-400 uppercase">{row.unidad}</div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-gray-500">{row.usuario}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-xl">
                            <PackageX className="text-rose-600" size={24} />
                        </div>
                        Bajas por Vencimiento
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Lotes dados de baja por caducidad de producto.</p>
                </div>
                <button
                    onClick={handlePrint}
                    disabled={rows.length === 0}
                    className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg font-bold text-sm"
                >
                    <Printer size={16} />
                    Imprimir Reporte
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] print:hidden">
                <div className="flex items-center gap-4">
                    <CalendarDays size={18} className="text-gray-400 shrink-0" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Período:</p>
                    <div className="flex items-center gap-3">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="px-4 py-2.5 text-sm rounded-xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-rose-500/50 outline-none font-bold cursor-pointer"
                        >
                            {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="px-4 py-2.5 text-sm rounded-xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-rose-500/50 outline-none font-bold cursor-pointer"
                        >
                            {YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards — always show totals globales, screen only */}
            {!isLoading && !error && rows.length > 0 && (
                <div className="grid grid-cols-2 gap-4 print:hidden">
                    <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lotes Dados de Baja</p>
                        <p className="text-4xl font-black text-rose-600 mt-2">{rows.length}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidades Eliminadas</p>
                        <p className="text-4xl font-black text-rose-600 mt-2">{totalUnidades}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] min-h-[420px] flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-rose-500" size={40} />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Cargando reporte...</p>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <AlertCircle className="mx-auto text-rose-400 mb-4" size={40} />
                        <p className="text-rose-600 font-bold">{error}</p>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-10">
                        <Archive className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">
                            No se registraron bajas por vencimiento en <span className="font-bold">{monthLabel} {year}</span>.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Print-only header */}
                        <div className="hidden print:block p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Reporte de Bajas por Vencimiento</h2>
                            <p className="text-sm text-gray-500 mt-1">Período: {monthLabel} {year}</p>
                            <div className="flex gap-8 mt-2 text-sm text-gray-600">
                                <span>Total lotes dados de baja: <strong>{rows.length}</strong></span>
                                <span>Total unidades eliminadas: <strong>{totalUnidades}</strong></span>
                            </div>
                        </div>

                        {renderTable()}

                        {/* Pagination footer — screen only */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/30 bg-white/20 mt-auto print:hidden">
                            <p className="text-xs font-medium text-gray-500">
                                Mostrando{" "}
                                <span className="font-black text-gray-700">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, rows.length)}
                                </span>{" "}
                                de <span className="font-black text-gray-700">{rows.length}</span> registros
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl text-gray-500 hover:text-rose-700 hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "w-8 h-8 rounded-xl text-xs font-black transition-all",
                                            page === currentPage
                                                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                                                : "text-gray-500 hover:text-rose-700 hover:bg-white/60"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl text-gray-500 hover:text-rose-700 hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
