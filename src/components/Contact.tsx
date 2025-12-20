"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";

export default function Contact() {
    return (
        <section id="contact" className="py-24 bg-gray-50 dark:bg-zinc-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-16 lg:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Contáctanos
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                            Estamos aquí para ayudarte. Envíanos un mensaje o visítanos en nuestra clínica.
                        </p>

                        <div className="mt-8 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-lime-100 p-3 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Ubicación</h3>
                                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                                        Av. Principal 123, Ciudad Médica<br />
                                        CP 12345, País
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-lime-100 p-3 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Teléfono</h3>
                                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                                        +1 (555) 123-4567
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-lime-100 p-3 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Email</h3>
                                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                                        contacto@clinicacolinas.com
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative h-[500px] overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-lg dark:border-zinc-800 dark:bg-zinc-800"
                    >
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.376878798664!2d-64.69524492424844!3d10.141258989971932!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c2d7310656041a7%3A0xe1084323750033a!2sAv.%20Guzm%C3%A1n%20Lander%2C%20Barcelona%206001%2C%20Anzo%C3%A1tegui!5e0!3m2!1ses!2sve!4v1701234567890!5m2!1ses!2sve"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="absolute inset-0 h-full w-full grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                        />

                        {/* Overlay for better integration */}
                        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
