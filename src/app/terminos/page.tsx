import Link from "next/link";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import { CLINIC_INFO } from "@/lib/constants/clinic-info";

export const metadata = {
    title: `Términos de Servicio — ${CLINIC_INFO.name}`,
    description: "Términos y condiciones del sistema de gestión de Clínicas Colina.",
};

export default function TerminosPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Back link */}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-lime-700 font-semibold hover:text-lime-800 mb-8 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Volver al inicio de sesión
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-10 py-10 flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl bg-lime-500/20 border border-lime-400/30 flex items-center justify-center shrink-0">
                            <FileText size={22} className="text-lime-400" />
                        </div>
                        <div>
                            <p className="text-lime-400 text-xs font-bold uppercase tracking-widest mb-1">{CLINIC_INFO.name}</p>
                            <h1 className="text-2xl font-extrabold text-white tracking-tight">Términos de Servicio</h1>
                            <p className="text-slate-400 text-sm mt-1">Última actualización: mayo 2025</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-10 py-10 space-y-8 text-sm text-gray-600 leading-relaxed">

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">1. Aceptación de los términos</h2>
                            <p>
                                Al acceder y utilizar el Sistema de Gestión de <strong>{CLINIC_INFO.name}</strong>, ubicada en {CLINIC_INFO.address.full}, usted acepta quedar vinculado por los presentes Términos de Servicio. Si no está de acuerdo con alguno de estos términos, le rogamos que no utilice el sistema.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">2. Uso del sistema</h2>
                            <p className="mb-3">
                                El acceso a este sistema está restringido a personal autorizado de {CLINIC_INFO.name} y a pacientes registrados. Usted se compromete a:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
                                <li>No compartir su cuenta con terceros no autorizados.</li>
                                <li>Notificar de inmediato cualquier uso no autorizado de su cuenta.</li>
                                <li>Utilizar el sistema exclusivamente para los fines para los que fue habilitado.</li>
                                <li>No intentar acceder a información que no le corresponde según su rol.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">3. Información médica y confidencialidad</h2>
                            <p>
                                La información médica contenida en este sistema es estrictamente confidencial y está protegida por la legislación venezolana vigente en materia de salud y protección de datos. Todo el personal con acceso al sistema está sujeto a las obligaciones de confidencialidad establecidas en su contrato y en la normativa aplicable.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">4. Propiedad intelectual</h2>
                            <p>
                                El software, diseño, contenidos y funcionalidades del sistema son propiedad de {CLINIC_INFO.name} o de sus proveedores tecnológicos. Queda prohibida su reproducción, distribución o modificación sin autorización expresa por escrito.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">5. Disponibilidad del servicio</h2>
                            <p>
                                {CLINIC_INFO.name} hará sus mejores esfuerzos para mantener el sistema disponible de forma continua. Sin embargo, no garantiza la disponibilidad ininterrumpida del servicio y se reserva el derecho de realizar mantenimientos programados o no programados cuando sea necesario.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">6. Limitación de responsabilidad</h2>
                            <p>
                                {CLINIC_INFO.name} no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del sistema, siempre que dichos daños no sean atribuibles a negligencia grave o dolo de la clínica.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">7. Modificaciones</h2>
                            <p>
                                {CLINIC_INFO.name} se reserva el derecho de modificar estos Términos de Servicio en cualquier momento. Los cambios serán notificados a los usuarios a través del sistema. El uso continuado del sistema tras dichas modificaciones implica la aceptación de los nuevos términos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">8. Contacto</h2>
                            <p>
                                Para cualquier consulta relacionada con estos términos, puede contactarnos en:
                            </p>
                            <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="font-semibold text-gray-800">{CLINIC_INFO.name}</p>
                                <p className="text-gray-500 mt-1">{CLINIC_INFO.address.full}</p>
                                <p className="text-gray-500">Teléfono: {CLINIC_INFO.contact.phones.join(" / ")}</p>
                                <p className="text-gray-500">Correo: {CLINIC_INFO.contact.email}</p>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
                            <Link href="/privacidad" className="text-lime-700 font-semibold text-sm hover:text-lime-800 hover:underline transition-colors flex items-center gap-1.5">
                                <Shield size={14} />
                                Ver Política de Privacidad
                            </Link>
                            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 font-semibold hover:text-gray-700 transition-colors">
                                <ArrowLeft size={14} />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
