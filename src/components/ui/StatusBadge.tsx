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
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: <Calendar size={12} />,
                    label: 'Programada'
                };
            case 'CONFIRMADA':
                return {
                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    icon: <CheckCircle size={12} />,
                    label: 'Confirmada'
                };
            case 'ATENDIDA':
            case 'COMPLETADA':
            case 'FINALIZADA':
                return {
                    color: 'bg-lime-100 text-lime-700 border-lime-200',
                    icon: <Activity size={12} />,
                    label: 'Atendida'
                };
            case 'CANCELADA':
                return {
                    color: 'bg-red-100 text-red-700 border-red-200',
                    icon: <XCircle size={12} />,
                    label: 'Cancelada'
                };
            case 'NO_ASISTIO':
            case 'NO_SHOW':
                return {
                    color: 'bg-orange-100 text-orange-700 border-orange-200',
                    icon: <UserX size={12} />,
                    label: 'No Asistió'
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: <Clock size={12} />,
                    label: status || 'Desconocido'
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.color} ${className}`}>
            {config.icon}
            {config.label}
        </span>
    );
}
