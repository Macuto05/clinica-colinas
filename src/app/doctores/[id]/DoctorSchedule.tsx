"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Schedule {
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function DoctorSchedule({ schedule }: { schedule: Schedule[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to get days in month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper to get first day of month (0-6)
    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Group schedule by day of week for easy lookup
    const scheduleByDay = new Map<number, Schedule[]>();
    schedule.forEach(slot => {
        if (!scheduleByDay.has(slot.dayOfWeek)) {
            scheduleByDay.set(slot.dayOfWeek, []);
        }
        scheduleByDay.get(slot.dayOfWeek)!.push(slot);
    });

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // Calculate grid
    const blanks = Array(firstDay).fill(null);
    const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarDays = [...blanks, ...dayNumbers];

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-zinc-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-lime-600" />
                Agenda de Disponibilidad
            </h2>

            <div className="space-y-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                        {MONTHS[currentDate.getMonth()]} <span className="text-lime-600">{currentDate.getFullYear()}</span>
                    </h2>
                    <div className="flex bg-gray-100 dark:bg-zinc-700 rounded-full p-1">
                        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white dark:hover:bg-zinc-600 shadow-sm transition-all text-gray-600 dark:text-gray-300">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white dark:hover:bg-zinc-600 shadow-sm transition-all text-gray-600 dark:text-gray-300">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-6">
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                    {calendarDays.map((day, index) => {
                        if (!day) return <div key={`blank-${index}`} />;

                        // Check availability
                        const dateParams = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dayOfWeek = dateParams.getDay();
                        const isAvailable = scheduleByDay.has(dayOfWeek);
                        const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

                        return (
                            <motion.div
                                key={day}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.01 }}
                                className="flex flex-col items-center gap-1 group relative z-0 hover:z-10"
                            >
                                <div
                                    className={`
                                        h-12 w-12 flex items-center justify-center rounded-2xl text-base font-semibold transition-all duration-300
                                        ${isAvailable
                                            ? "bg-gradient-to-br from-lime-400 to-green-500 text-white shadow-lime-200 dark:shadow-lime-900/20 shadow-lg cursor-pointer transform hover:-translate-y-1 hover:shadow-xl"
                                            : "text-gray-400 dark:text-gray-600 bg-transparent"}
                                        ${isToday && !isAvailable ? "ring-2 ring-lime-500 text-lime-600" : ""}
                                    `}
                                >
                                    {day}
                                </div>

                                {/* Hover Tooltip for Slots */}
                                {isAvailable && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-56 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        <div className="bg-gray-900/95 backdrop-blur-md text-white text-sm rounded-xl p-4 shadow-2xl border border-white/10">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                                <Clock className="w-4 h-4 text-lime-400" />
                                                <span className="font-bold">Horarios Disponibles</span>
                                            </div>
                                            <div className="space-y-2">
                                                {scheduleByDay.get(dayOfWeek)!.map((slot, i) => (
                                                    <div key={i} className="flex justify-between items-center text-gray-300">
                                                        <span>Turno {i + 1}</span>
                                                        <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-xs text-white">
                                                            {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900/95"></div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-10 flex flex-wrap justify-center gap-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                    <div className="flex items-center gap-3 bg-lime-50 dark:bg-lime-900/10 px-4 py-2 rounded-full">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-lime-400 to-green-500 shadow-sm"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Día de Consulta</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <span className="text-sm font-medium text-gray-500">No disponible</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
