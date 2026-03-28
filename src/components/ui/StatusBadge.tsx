import { Calendar, CheckCircle, XCircle, UserX, Clock, Activity } from "lucide-react";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
    const getStatusConfig = (status: string) => {
        const normalized = status?.toUpperCase() || '';

        switch (normalized) {
            case 'PROGRAMADA':
                return {
                    color: 'bg-blue-500/20 text-blue-800 border-blue-300/40 shadow-sm shadow-blue-100 backdrop-blur-sm',
                    icon: <Calendar size={13} />,
                    label: 'Programada'
                };
            case 'CONFIRMADA':
                return {
                    color: 'bg-emerald-500/20 text-emerald-800 border-emerald-300/40 shadow-sm shadow-emerald-100 backdrop-blur-sm',
                    icon: <CheckCircle size={13} />,
                    label: 'Confirmada'
                };
            case 'ATENDIDA':
            case 'COMPLETADA':
            case 'FINALIZADA':
                return {
                    color: 'bg-lime-500/20 text-lime-800 border-lime-300/40 shadow-sm shadow-lime-100 backdrop-blur-sm',
                    icon: <Activity size={13} />,
                    label: 'Atendida'
                };
            case 'CANCELADA':
                return {
                    color: 'bg-rose-500/20 text-rose-800 border-rose-300/40 shadow-sm shadow-rose-100 backdrop-blur-sm',
                    icon: <XCircle size={13} />,
                    label: 'Cancelada'
                };
            case 'NO_ASISTIO':
            case 'NO_SHOW':
                return {
                    color: 'bg-orange-500/20 text-orange-800 border-orange-300/40 shadow-sm shadow-orange-100 backdrop-blur-sm',
                    icon: <UserX size={13} />,
                    label: 'No Asistió'
                };
            default:
                return {
                    color: 'bg-gray-500/10 text-gray-700 border-gray-300/40 shadow-sm backdrop-blur-sm',
                    icon: <Clock size={13} />,
                    label: status || 'Desconocido'
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${config.color} ${className}`}>
            {config.icon}
            {config.label}
        </span>
    );
}
