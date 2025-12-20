import Link from "next/link";
import { Facebook, Instagram, Linkedin, Stethoscope, Twitter } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 dark:bg-black dark:border-gray-800">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-600 text-white">
                                <Stethoscope size={20} />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                Clínica Colinas
                            </span>
                        </div>
                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                            Comprometidos con tu salud y bienestar. Tecnología avanzada y atención humana para ti y tu familia.
                        </p>
                        <div className="mt-6 flex space-x-4">
                            <Link href="#" className="text-gray-400 hover:text-lime-600">
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-pink-600">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-lime-400">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-lime-700">
                                <Linkedin className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Enlaces</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link href="/" className="text-sm text-gray-600 hover:text-lime-600 dark:text-gray-400 dark:hover:text-lime-400">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/servicios" className="text-sm text-gray-600 hover:text-lime-600 dark:text-gray-400 dark:hover:text-lime-400">
                                    Servicios
                                </Link>
                            </li>
                            <li>
                                <Link href="/nosotros" className="text-sm text-gray-600 hover:text-lime-600 dark:text-gray-400 dark:hover:text-lime-400">
                                    Nosotros
                                </Link>
                            </li>
                            <li>
                                <Link href="/contacto" className="text-sm text-gray-600 hover:text-lime-600 dark:text-gray-400 dark:hover:text-lime-400">
                                    Contacto
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Legal</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link href="#" className="text-sm text-gray-600 hover:text-lime-600 dark:text-gray-400 dark:hover:text-lime-400">
                                    Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-gray-600 hover:text-lime-600 dark:text-gray-400 dark:hover:text-lime-400">
                                    Términos
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
                    <p className="text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Clínica Colinas. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
