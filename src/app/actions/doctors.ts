"use server";

import prisma from "@/infrastructure/database/prisma/client";
import { getSpecialtyBySlug } from "@/data/specialties-data";

export async function getDoctorsBySpecialtySlug(slug: string) {
    const specialtyData = getSpecialtyBySlug(slug);

    if (!specialtyData) {
        return [];
    }

    try {
        // Find doctors by specialty string in Medico table
        const doctors = await prisma.medico.findMany({
            where: {
                especialidad: specialtyData.name
            },
            include: {
                empleado: {
                    include: {
                        usuario: true
                    }
                }
            }
        });

        // Transform data
        return doctors.map(doctor => ({
            id: Number(doctor.empleadoId),
            name: `${doctor.empleado.nombres} ${doctor.empleado.apellidos}`,
            credentials: doctor.licenciaProfesional || "Médico Especialista",
            experience: "Especialista con amplia experiencia.", // Placeholder as biography is not in Schema
            specialty: doctor.especialidad,
            imageUrl: "/images/doctors/default.jpg" // Default image or handle if DB has it. Schema doesn't show imageUrl.
        }));

    } catch (error) {
        console.error("Error fetching doctors:", error);
        return [];
    }
}

export async function getDoctorById(id: number) {
    try {
        const doctor = await prisma.medico.findUnique({
            where: {
                empleadoId: id
            },
            include: {
                empleado: {
                    include: {
                        usuario: true
                    }
                }
            }
        });

        if (!doctor) return null;

        return {
            id: Number(doctor.empleadoId),
            name: `${doctor.empleado.nombres} ${doctor.empleado.apellidos}`,
            email: doctor.empleado.usuario?.email || "",
            phone: doctor.empleado.telefono,
            address: "", // Address is on Patient usually, or we need to add to Empleado/Medico
            specialty: doctor.especialidad,
            biography: "",
            license: doctor.licenciaProfesional,
            schedule: [], // Schedule removed
            imageUrl: "/images/doctors/default.jpg"
        };
    } catch (error) {
        console.error("Error fetching doctor:", error);
        return null;
    }
}

export async function updateDoctor(id: number, data: {
    license?: string;
}) {
    try {
        const updatedDoctor = await prisma.medico.update({
            where: { empleadoId: id },
            data: {
                licenciaProfesional: data.license,
            }
        });
        return { success: true, doctor: updatedDoctor };
    } catch (error) {
        console.error("Error updating doctor:", error);
        return { success: false, error: "Failed to update doctor" };
    }
}
