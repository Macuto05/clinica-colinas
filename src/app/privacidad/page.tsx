import Link from "next/link";
import { ArrowLeft, Shield, FileText, Lock, Eye, Database, UserCheck } from "lucide-react";
import { CLINIC_INFO } from "@/lib/constants/clinic-info";

export const metadata = {
    title: `Política de Privacidad — ${CLINIC_INFO.name}`,
    description: "Política de privacidad y tratamiento de datos personales de Clínicas Colina.",
};

export default function PrivacidadPage() {
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
                            <Shield size={22} className="text-lime-400" />
                        </div>
                        <div>
                            <p className="text-lime-400 text-xs font-bold uppercase tracking-widest mb-1">{CLINIC_INFO.name}</p>
                            <h1 className="text-2xl font-extrabold text-white tracking-tight">Política de Privacidad</h1>
                            <p className="text-slate-400 text-sm mt-1">Última actualización: mayo 2025</p>
                        </div>
                    </div>

                    {/* Summary pills */}
                    <div className="px-10 py-6 bg-lime-50/60 border-b border-lime-100/80 flex flex-wrap gap-3">
                        {[
                            { icon: Lock, label: "Datos protegidos" },
                            { icon: Eye, label: "Sin venta a terceros" },
                            { icon: Database, label: "Almacenamiento seguro" },
                            { icon: UserCheck, label: "Control del usuario" },
                        ].map(({ icon: Icon, label }) => (
                            <span key={label} className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-800 bg-white border border-lime-200 rounded-full px-3 py-1.5 shadow-sm">
                                <Icon size={12} className="text-lime-600" />
                                {label}
                            </span>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="px-10 py-10 space-y-8 text-sm text-gray-600 leading-relaxed">

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
                            <p>
                                <strong>{CLINIC_INFO.name}</strong>, con domicilio en {CLINIC_INFO.address.full}, es la responsable del tratamiento de los datos personales recopilados a través de este sistema de gestión.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">2. Datos que recopilamos</h2>
                            <p className="mb-3">En función de su rol en el sistema, podemos recopilar:</p>
                            <div className="grid gap-3">
                                {[
                                    { title: "Pacientes", items: ["Nombre completo y documento de identidad", "Fecha de nacimiento y sexo", "Información de contacto (teléfono, correo, dirección)", "Historial médico, diagnósticos y resultados de exámenes", "Información de seguros médicos y pólizas"] },
                                    { title: "Personal y empleados", items: ["Datos de identificación y contacto", "Credenciales de acceso (contraseña almacenada de forma cifrada)", "Registro de actividades dentro del sistema"] },
                                ].map(({ title, items }) => (
                                    <div key={title} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">{title}</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {items.map(i => <li key={i}>{i}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">3. Finalidad del tratamiento</h2>
                            <p className="mb-3">Sus datos personales son tratados exclusivamente para:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Gestionar la atención médica y el historial clínico de los pacientes.</li>
                                <li>Administrar citas, emergencias, facturación e inventario.</li>
                                <li>Garantizar la seguridad del sistema mediante autenticación de usuarios.</li>
                                <li>Cumplir con las obligaciones legales aplicables en Venezuela.</li>
                                <li>Generar reportes internos para la mejora de la gestión clínica.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">4. Base legal del tratamiento</h2>
                            <p>
                                El tratamiento de datos se basa en: (i) la ejecución de la relación contractual o asistencial entre usted y la clínica; (ii) el cumplimiento de obligaciones legales en materia de salud; y (iii) su consentimiento expreso cuando corresponda.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">5. Compartición de datos</h2>
                            <p>
                                {CLINIC_INFO.name} <strong>no vende ni cede</strong> sus datos personales a terceros con fines comerciales. Los datos podrán ser compartidos únicamente con:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5 mt-3">
                                <li>Aseguradoras, exclusivamente para la gestión de coberturas autorizadas por el paciente.</li>
                                <li>Autoridades sanitarias o judiciales cuando exista obligación legal.</li>
                                <li>Proveedores de tecnología que actúen como encargados del tratamiento bajo acuerdos de confidencialidad.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">6. Seguridad de los datos</h2>
                            <p>
                                Aplicamos medidas técnicas y organizativas apropiadas para proteger sus datos contra acceso no autorizado, pérdida o alteración. Las contraseñas se almacenan cifradas mediante algoritmos de hash seguros y el acceso al sistema está controlado por un sistema de roles y permisos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">7. Sus derechos</h2>
                            <p className="mb-3">Usted tiene derecho a:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Acceder</strong> a los datos personales que tenemos sobre usted.</li>
                                <li><strong>Rectificar</strong> datos inexactos o incompletos.</li>
                                <li><strong>Solicitar la eliminación</strong> de sus datos cuando ya no sean necesarios, salvo obligación legal de conservación.</li>
                                <li><strong>Oponerse</strong> al tratamiento en determinadas circunstancias.</li>
                            </ul>
                            <p className="mt-3">Para ejercer estos derechos, contáctenos en {CLINIC_INFO.contact.email}.</p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">8. Conservación de datos</h2>
                            <p>
                                Los datos clínicos se conservan durante el tiempo mínimo exigido por la normativa sanitaria venezolana. Los datos de acceso al sistema se eliminan cuando el usuario ya no tenga relación activa con la clínica, salvo que exista obligación legal de conservación.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-gray-900 mb-3">9. Contacto</h2>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="font-semibold text-gray-800">{CLINIC_INFO.name}</p>
                                <p className="text-gray-500 mt-1">{CLINIC_INFO.address.full}</p>
                                <p className="text-gray-500">Teléfono: {CLINIC_INFO.contact.phones.join(" / ")}</p>
                                <p className="text-gray-500">Correo: {CLINIC_INFO.contact.email}</p>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
                            <Link href="/terminos" className="text-lime-700 font-semibold text-sm hover:text-lime-800 hover:underline transition-colors flex items-center gap-1.5">
                                <FileText size={14} />
                                Ver Términos de Servicio
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
