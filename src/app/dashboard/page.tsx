"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, PlusCircle, User as UserIcon, CreditCard } from "lucide-react";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { PageLoader } from "@/components/ui/PageLoader";

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

    const fetchDebt = async () => {
        if (!user || (user as any).role !== 'PACIENTE') return;
        try {
            const patientId = (user as any).patientId;
            const res = await fetch(`/api/billing/invoices?patientId=${patientId}`);
            if (res.ok) {
                const data = await res.json();
                setDebt({
                    total: data.totalDeuda,
                    totalEnRevision: data.totalEnRevision || 0,
                    totalDeudaBs: data.totalDeudaBs || 0,
                    invoices: data.facturas
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Fetch both next appointment and debt in parallel
    useEffect(() => {
        if (!user || (user as any).role !== 'PACIENTE') {
            setIsLoadingNextAppt(false);
            return;
        }
        const patientId = (user as any).patientId;
        if (!patientId) { setIsLoadingNextAppt(false); return; }

        const fetchNextAppointment = async () => {
            try {
                const response = await fetch(`/api/appointments?patientId=${patientId}`);
                if (response.ok) {
                    const data = await response.json();
                    const future = data
                        .filter((apt: any) => (apt.status === 'PROGRAMADA' || apt.status === 'PENDING') && apt.type !== 'EMERGENCIA')
                        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    if (future.length > 0) setNextAppointment(future[0]);
                }
            } catch (error) {
                console.error("Failed to fetch next appointment", error);
            } finally {
                setIsLoadingNextAppt(false);
            }
        };

        Promise.all([fetchNextAppointment(), fetchDebt()]);
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
        return <PageLoader message="Cargando resumen..." minHeight="min-h-screen" />;
    }

    // ... displayName logic ...
    const firstName = user?.firstName?.split(" ")[0] || "";
    const lastName = user?.lastName?.split(" ")[0] || "";
    const displayName = `${firstName} ${lastName}`.trim() || user?.firstName || "Usuario";

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Welcome Card */}
                <div className="flex-1 bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Hola, {displayName} 👋
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Bienvenido a tu panel de salud.
                    </p>
                </div>

                {/* Billing Summary Card */}
                <div className="bg-blue-600/90 backdrop-blur-xl rounded-[2.5rem] p-6 text-white shadow-[0_8px_32px_0_rgba(37,99,235,0.2)] border border-blue-400/50 w-full md:w-80 flex flex-col justify-between relative overflow-hidden">
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
                                className="mt-4 bg-white/90 backdrop-blur-md text-blue-700 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-white transition-colors w-full flex items-center justify-center gap-2 relative z-10 shadow-sm"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Quick Action: New Appointment */}
                <div className="bg-lime-500/95 backdrop-blur-xl rounded-3xl p-6 text-white shadow-[0_8px_20px_rgba(132,204,22,0.3)] border border-lime-400/50 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => router.push("/dashboard/citas/nueva")}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <PlusCircle size={24} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Nueva Cita</h3>
                        <p className="text-lime-100 text-sm mb-4">Agenda una consulta con nuestros especialistas.</p>
                        <button className="bg-white/90 backdrop-blur-md text-lime-700 px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-white hover:shadow-md transition-all w-full sm:w-auto">
                            Reservar Ahora
                        </button>
                    </div>
                </div>

                {/* Quick Action: My Appointments */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 hover:bg-white/60 hover:border-lime-300/50 transition-all cursor-pointer group hover:shadow-lg" onClick={() => router.push("/dashboard/citas")}>
                    <div className="bg-lime-500/10 backdrop-blur-md border border-lime-500/20 shadow-inner w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-lime-500/20 transition-all">
                        <Calendar size={24} className="text-lime-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mis Visitas</h3>
                    <p className="text-gray-500 text-sm">Revisa tus próximas consultas y el historial de atenciones y emergencias.</p>
                </div>

                {/* Quick Action: Profile */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 hover:bg-white/60 hover:border-lime-300/50 transition-all cursor-pointer group hover:shadow-lg" onClick={() => router.push("/dashboard/perfil")}>
                    <div className="bg-lime-500/10 backdrop-blur-md border border-lime-500/20 shadow-inner w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-lime-500/20 transition-all">
                        <UserIcon size={24} className="text-lime-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mi Perfil</h3>
                    <p className="text-gray-500 text-sm">Actualiza tus datos personales y de contacto.</p>
                </div>

                {/* Quick Action: Results */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 hover:bg-white/60 hover:border-lime-300/50 transition-all cursor-pointer group hover:shadow-lg" onClick={() => router.push("/dashboard/resultados")}>
                    <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 shadow-inner w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mis Resultados</h3>
                    <p className="text-gray-500 text-sm">Visualiza y descarga exámenes de laboratorio e imagenología.</p>
                </div>
            </div>

            {/* Recent Activity / Next Appointment */}
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Próxima Cita</h2>
                {isLoadingNextAppt ? (
                    <PageLoader message="Buscando próxima cita..." minHeight="min-h-[100px]" />
                ) : nextAppointment ? (
                    <div className="bg-white/50 backdrop-blur-md border border-white/60 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-white/70 backdrop-blur-sm p-3 rounded-2xl border border-white/80 shadow-sm">
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
                                    className="bg-lime-500/95 text-white font-bold text-sm px-6 py-3 rounded-2xl hover:bg-lime-600 transition-colors shadow-[0_4px_12px_rgba(132,204,22,0.3)] border border-lime-400/50 flex items-center gap-2"
                                >
                                    <CreditCard size={16} />
                                    Pagar
                                </button>
                            )
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-white/30 backdrop-blur-sm rounded-3xl border border-dashed border-white/60">
                        <Calendar size={48} className="mx-auto text-gray-400/80 mb-3" />
                        <p className="text-gray-500 font-bold">No tienes citas programadas próximamente</p>
                        <button
                            onClick={() => router.push("/dashboard/citas/nueva")}
                            className="text-lime-700 text-sm font-bold bg-white/50 px-5 py-2.5 rounded-2xl border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:bg-white hover:shadow-md transition-all mt-4"
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


