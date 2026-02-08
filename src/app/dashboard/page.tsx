"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, PlusCircle, User as UserIcon, CreditCard } from "lucide-react";
import { PaymentModal } from "@/components/billing/PaymentModal";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [nextAppointment, setNextAppointment] = useState<any>(null);
    const [isLoadingNextAppt, setIsLoadingNextAppt] = useState(true);

    // Billing State
    const [debt, setDebt] = useState<{ total: number; totalEnRevision: number; totalDeudaBs: number; invoices: any[] }>({ total: 0, totalEnRevision: 0, totalDeudaBs: 0, invoices: [] });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
    const [paymentAmount, setPaymentAmount] = useState(0);

    // Fetch Next Appointment
    useEffect(() => {
        const fetchNextAppointment = async () => {
            if (!user || user.role !== 'PACIENTE') {
                setIsLoadingNextAppt(false);
                return;
            }
            try {
                const patientId = (user as any).patientId;
                if (!patientId) { setIsLoadingNextAppt(false); return; }

                const response = await fetch(`/api/appointments?patientId=${patientId}`);
                if (response.ok) {
                    const data = await response.json();
                    const now = new Date();
                    const futureAppointments = data.filter((apt: any) => {
                        return apt.status === 'PROGRAMADA' || apt.status === 'PENDING';
                    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    if (futureAppointments.length > 0) {
                        setNextAppointment(futureAppointments[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch next appointment", error);
            } finally {
                setIsLoadingNextAppt(false);
            }
        };

        if (user) {
            fetchNextAppointment();
        }
    }, [user]);

    // Fetch Debt
    const fetchDebt = async () => {
        if (!user || (user as any).role !== 'PACIENTE') return;
        try {
            const patientId = (user as any).patientId;
            const res = await fetch(`/api/billing/invoices?patientId=${patientId}`);
            if (res.ok) {
                const data = await res.json();
                setDebt({
                    total: data.totalDeuda,
                    totalEnRevision: data.totalEnRevision || 0, // Fallback safety
                    totalDeudaBs: data.totalDeudaBs || 0, // Fallback safety
                    invoices: data.facturas
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (user) fetchDebt();
    }, [user]);

    const handlePayClick = (invoiceId?: string, amount?: number) => {
        if (invoiceId) {
            setSelectedInvoiceId(invoiceId);
            setPaymentAmount(amount || 0);
        } else if (debt.invoices.length > 0) {
            // Default to oldest invoice if global pay
            const oldest = debt.invoices[0]; // Assumes sorted by DB (usually ID asc or Date asc)
            setSelectedInvoiceId(oldest.facturaId);
            setPaymentAmount(oldest.saldoPendiente);
        } else {
            return; // No debt
        }
        setIsPaymentModalOpen(true);
    };

    // ... existing loading check ...
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // ... displayName logic ...
    const firstName = user?.firstName?.split(" ")[0] || "";
    const lastName = user?.lastName?.split(" ")[0] || "";
    const displayName = `${firstName} ${lastName}`.trim() || user?.firstName || "Usuario";

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Welcome Card */}
                <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Hola, {displayName} 👋
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Bienvenido a tu panel de salud.
                    </p>
                </div>

                {/* Billing Summary Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20 w-full md:w-80 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CreditCard size={80} />
                    </div>
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Tu Saldo Pendiente</p>
                        <h3 className="text-3xl font-bold">${debt.total.toFixed(2)}</h3>
                        {(debt as any).totalDeudaBs > 0 && (
                            <p className="text-sm text-blue-200 font-medium">
                                Bs {(debt as any).totalDeudaBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </p>
                        )}
                        {(debt as any).totalEnRevision > 0 && (
                            <div className="text-xs text-blue-200 mt-1 flex items-center gap-1">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                ${(debt as any).totalEnRevision.toFixed(2)} en revisión
                            </div>
                        )}
                    </div>

                    {debt.total > 0 ? (
                        (debt as any).totalEnRevision >= debt.total ? (
                            <div className="mt-4 flex items-center gap-2 text-white/90 text-sm bg-white/10 p-2 rounded-lg border border-white/20">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                Pago en validación
                            </div>
                        ) : (
                            <button
                                onClick={() => handlePayClick()}
                                className="mt-4 bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors w-full flex items-center justify-center gap-2 relative z-10"
                            >
                                <CreditCard size={16} /> Pagar Ahora
                            </button>
                        )
                    ) : (
                        <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm bg-white/10 p-2 rounded-lg">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Al día con tus pagos
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Action: New Appointment */}
                <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-2xl p-6 text-white shadow-lg shadow-lime-600/20 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => router.push("/dashboard/citas/nueva")}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <PlusCircle size={24} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Nueva Cita</h3>
                        <p className="text-lime-100 text-sm mb-4">Agenda una consulta con nuestros especialistas.</p>
                        <button className="bg-white text-lime-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-lime-50 transition-colors w-full sm:w-auto">
                            Reservar Ahora
                        </button>
                    </div>
                </div>

                {/* Quick Action: My Appointments */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-lime-200 transition-colors cursor-pointer group" onClick={() => router.push("/dashboard/citas")}>
                    <div className="bg-lime-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-lime-100 transition-colors">
                        <Calendar size={24} className="text-lime-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mis Citas</h3>
                    <p className="text-gray-500 text-sm">Revisa tus próximas consultas y el historial de atenciones.</p>
                </div>

                {/* Quick Action: Profile */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-lime-200 transition-colors cursor-pointer group" onClick={() => router.push("/dashboard/perfil")}>
                    <div className="bg-lime-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-lime-100 transition-colors">
                        <UserIcon size={24} className="text-lime-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mi Perfil</h3>
                    <p className="text-gray-500 text-sm">Actualiza tus datos personales y de contacto.</p>
                </div>
            </div>

            {/* Recent Activity / Next Appointment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Próxima Cita</h2>
                {isLoadingNextAppt ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600 mx-auto"></div>
                    </div>
                ) : nextAppointment ? (
                    <div className="bg-lime-50 border border-lime-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <Calendar className="text-lime-600" size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900">{nextAppointment.type}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase
                                        ${nextAppointment.status === 'PROGRAMADA' ? 'bg-blue-100 text-blue-700' :
                                            nextAppointment.status === 'COMPLETADA' ? 'bg-green-100 text-green-700' :
                                                nextAppointment.status === 'CONFIRMADA' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                        {nextAppointment.status}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm">Dr. {nextAppointment.doctorName || 'No asignado'}</p>
                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                    <span>{String(new Date(nextAppointment.date).getUTCDate()).padStart(2, '0')}/{String(new Date(nextAppointment.date).getUTCMonth() + 1).padStart(2, '0')}/{new Date(nextAppointment.date).getUTCFullYear()}</span>
                                    <span>{nextAppointment.startTime} - {nextAppointment.endTime}</span>
                                </div>
                            </div>
                        </div>
                        {/* 
                            Logic: If there is debt associated with this appointment (or generic debt), show Pay button.
                            Ideally we'd check if THIS specific appointment is paid.
                            But for MVP, if debt > 0, we allow paying.
                        */}
                        {debt.total > 0 && (
                            (debt as any).totalEnRevision >= debt.total ? (
                                <button
                                    disabled
                                    className="bg-yellow-100/50 text-yellow-700 font-semibold text-sm px-6 py-2 rounded-lg border border-yellow-200/50 cursor-not-allowed flex items-center gap-2"
                                >
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                    Validando
                                </button>
                            ) : (
                                <button
                                    onClick={() => handlePayClick()}
                                    className="bg-lime-600 text-white font-semibold text-sm px-6 py-2 rounded-lg hover:bg-lime-700 transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <CreditCard size={16} />
                                    Pagar
                                </button>
                            )
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No tienes citas programadas próximamente</p>
                        <button
                            onClick={() => router.push("/dashboard/citas/nueva")}
                            className="text-lime-600 text-sm font-semibold hover:underline mt-2"
                        >
                            Agendar una cita
                        </button>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                invoiceId={selectedInvoiceId}
                totalAmount={paymentAmount}
                onSuccess={fetchDebt}
            />
        </div>
    );
}


