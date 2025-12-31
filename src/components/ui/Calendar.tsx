import React, { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
    isToday,
    getDay,
    isBefore,
    startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale'; // Spanish locale
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
    value: Date | null;
    onChange: (date: Date) => void;
    doctorId?: string; // Need doctorId to fetch availability
}

type DayStatus = 'AVAILABLE' | 'FULL' | 'OFF' | 'PAST';

interface DayAvailability {
    date: string;
    status: DayStatus;
}

export const Calendar: React.FC<CalendarProps> = ({
    value,
    onChange,
    doctorId
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(value);
    const [availabilityMap, setAvailabilityMap] = useState<Record<string, DayStatus>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setSelectedDate(value);
    }, [value]);

    useEffect(() => {
        if (doctorId) {
            fetchAvailability();
        }
    }, [currentMonth, doctorId]);

    const fetchAvailability = async () => {
        if (!doctorId) return;
        setIsLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const res = await fetch(`/api/doctors/${doctorId}/month-availability?year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                const map: Record<string, DayStatus> = {};
                data.availability.forEach((d: DayAvailability) => {
                    map[d.date] = d.status;
                });
                setAvailabilityMap(map);
            }
        } catch (error) {
            console.error("Error fetching availability", error);
        } finally {
            setIsLoading(false);
        }
    };

    const nextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const onDateClick = (day: Date, status: DayStatus) => {
        if (status === 'AVAILABLE') {
            onChange(day);
        }
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    type="button"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-gray-800 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </span>
                    {isLoading && <span className="text-xs text-lime-600 animate-pulse">Cargando disponibilidad...</span>}
                </div>
                <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    type="button"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return (
            <div className="grid grid-cols-7 mb-2 gap-1">
                {days.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-400 py-1">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';
        const today = startOfDay(new Date());

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;
                const dateKey = format(day, 'yyyy-MM-dd');

                // Status Logic
                let status: DayStatus = 'OFF';

                if (isBefore(day, today)) {
                    status = 'PAST';
                } else if (availabilityMap[dateKey]) {
                    status = availabilityMap[dateKey];
                }

                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isCurrentMonth = isSameMonth(day, monthStart);

                // Styling based on status
                let cellClass = "relative h-12 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ";

                if (!isCurrentMonth) {
                    cellClass += "opacity-30 "; // Dim days from other months
                }

                if (status === 'PAST' || status === 'OFF') {
                    cellClass += "text-gray-300 bg-gray-50 cursor-not-allowed ";
                } else if (status === 'FULL') {
                    cellClass += "bg-red-500 text-white cursor-not-allowed shadow-sm "; // Red for Full
                } else if (status === 'AVAILABLE') {
                    if (isSelected) {
                        cellClass += "bg-lime-600 text-white shadow-md transform scale-105 border-2 border-lime-700 z-10 ";
                    } else {
                        cellClass += "bg-lime-100 text-lime-800 hover:bg-lime-200 cursor-pointer border border-lime-200 ";
                    }
                }

                days.push(
                    <div
                        className="flex justify-center items-center p-0.5 w-full"
                        key={day.toString()}
                    >
                        <div
                            className={cellClass}
                            onClick={() => onDateClick(cloneDay, status)}
                        >
                            {formattedDate}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="space-y-1">{rows}</div>;
    };

    return (
        <div className="bg-white rounded-2xl p-6 w-full shadow-nil border-nil">
            {/* Legend */}
            <div className="flex gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-lime-100 border border-lime-200 rounded"></div>
                    <span className="text-gray-600">Disponible</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-600">Ocupado</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-50 rounded"></div>
                    <span className="text-gray-400">No disponible</span>
                </div>
            </div>

            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
};
