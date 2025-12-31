import { useState, useEffect } from "react";
import { Plus, Trash2, Clock } from "lucide-react";

export type TimeBlock = {
    startTime: string;
    endTime: string;
};

export type DaySchedule = {
    day: string; // 'LUNES', 'MARTES', etc.
    active: boolean;
    blocks: TimeBlock[];
};

interface ScheduleEditorProps {
    value: DaySchedule[];
    onChange: (schedule: DaySchedule[]) => void;
}

const DAYS_OF_WEEK = [
    { key: "LUNES", label: "Lunes" },
    { key: "MARTES", label: "Martes" },
    { key: "MIERCOLES", label: "Miércoles" },
    { key: "JUEVES", label: "Jueves" },
    { key: "VIERNES", label: "Viernes" },
    { key: "SABADO", label: "Sábado" },
    { key: "DOMINGO", label: "Domingo" },
];

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
    // Helper to ensure we always have a valid schedule structure
    const getSafeSchedule = () => {
        if (value && value.length > 0) return value;
        return DAYS_OF_WEEK.map(day => ({
            day: day.key,
            active: false,
            blocks: [{ startTime: "09:00", endTime: "17:00" }]
        }));
    };

    // Initialize if empty - ensuring it actually applies
    useEffect(() => {
        if (!value || value.length === 0) {
            onChange(getSafeSchedule());
        }
    }, [value, onChange]); // React to empty value

    // Helper to update a specific day
    const updateDay = (dayKey: string, updates: Partial<DaySchedule>) => {
        const currentSchedule = getSafeSchedule();
        const newSchedule = currentSchedule.map(d => {
            if (d.day === dayKey) {
                const updatedDay = { ...d, ...updates };
                // If activating and no blocks, add default business hours
                if (updates.active === true && updatedDay.blocks.length === 0) {
                    updatedDay.blocks = [{ startTime: "09:00", endTime: "17:00" }];
                }
                return updatedDay;
            }
            return d;
        });
        onChange(newSchedule);
    };

    // Helper to update a specific block
    const updateBlock = (dayKey: string, blockIndex: number, field: keyof TimeBlock, newVal: string) => {
        const currentSchedule = getSafeSchedule();
        const newSchedule = currentSchedule.map(d => {
            if (d.day !== dayKey) return d;
            const newBlocks = [...d.blocks];
            newBlocks[blockIndex] = { ...newBlocks[blockIndex], [field]: newVal };
            return { ...d, blocks: newBlocks };
        });
        onChange(newSchedule);
    };

    const addBlock = (dayKey: string) => {
        const currentSchedule = getSafeSchedule();
        const newSchedule = currentSchedule.map(d => {
            if (d.day !== dayKey) return d;
            return {
                ...d,
                blocks: [...d.blocks, { startTime: "14:00", endTime: "18:00" }]
            };
        });
        onChange(newSchedule);
    };

    const removeBlock = (dayKey: string, blockIndex: number) => {
        const currentSchedule = getSafeSchedule();
        const newSchedule = currentSchedule.map(d => {
            if (d.day !== dayKey) return d;
            const newBlocks = d.blocks.filter((_, idx) => idx !== blockIndex);
            return { ...d, blocks: newBlocks };
        });
        onChange(newSchedule);
    };

    if (!value || value.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Configuración de Horario Base</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Define los días y horas que el médico labora regularmente. Este horario se usará para generar la disponibilidad de citas automáticamente cada semana.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {DAYS_OF_WEEK.map((dayConfig) => {
                    const dayData = value.find(d => d.day === dayConfig.key) || {
                        day: dayConfig.key, active: false, blocks: []
                    };
                    const isActive = dayData.active;

                    return (
                        <div
                            key={dayConfig.key}
                            className={`border rounded-xl transition-all ${isActive
                                ? "border-lime-200 bg-white dark:bg-zinc-900 dark:border-lime-900 shadow-sm"
                                : "border-gray-100 bg-gray-50/50 dark:bg-zinc-900/50 dark:border-zinc-800 opacity-70"
                                }`}
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isActive}
                                                onChange={(e) => updateDay(dayConfig.key, { active: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-lime-300 dark:peer-focus:ring-lime-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-lime-600"></div>
                                            <span className={`ml-3 font-medium select-none ${isActive ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                                                {dayConfig.label}
                                            </span>
                                        </label>
                                    </div>

                                    {isActive && (
                                        <button
                                            type="button"
                                            onClick={() => addBlock(dayConfig.key)}
                                            className="text-xs flex items-center gap-1 text-lime-600 hover:text-lime-700 font-medium bg-lime-50 hover:bg-lime-100 px-2 py-1 rounded transition-colors dark:bg-lime-900/30 dark:text-lime-400"
                                        >
                                            <Plus size={14} />
                                            Agregar Bloque
                                        </button>
                                    )}
                                </div>

                                {isActive && (
                                    <div className="space-y-2 pl-14">
                                        {dayData.blocks.map((block, index) => (
                                            <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 w-12">Desde:</span>
                                                    <input
                                                        type="time"
                                                        value={block.startTime}
                                                        onChange={(e) => updateBlock(dayConfig.key, index, "startTime", e.target.value)}
                                                        className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-lime-500 outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 w-12">Hasta:</span>
                                                    <input
                                                        type="time"
                                                        value={block.endTime}
                                                        onChange={(e) => updateBlock(dayConfig.key, index, "endTime", e.target.value)}
                                                        className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-lime-500 outline-none"
                                                    />
                                                </div>

                                                {dayData.blocks.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBlock(dayConfig.key, index)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors dark:hover:bg-red-900/20"
                                                        title="Eliminar bloque"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {dayData.blocks.length === 0 && (
                                            <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                                                Debes agregar al menos un bloque de horario para este día activo.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
