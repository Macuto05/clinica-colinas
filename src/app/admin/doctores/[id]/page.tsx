
import DoctorEditForm from "./DoctorEditForm";
import prisma from "@/infrastructure/database/prisma/client";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminDoctorEditPage({ params }: PageProps) {
    const { id } = await params;

    // Parse ID (handling potential errors if it's not a number)
    const doctorId = parseInt(id);
    if (isNaN(doctorId)) {
        notFound();
    }

    const doctor = await prisma.medico.findUnique({
        where: {
            empleadoId: doctorId
        },
        include: {
            especialidad: true,
            empleado: {
                include: {
                    usuario: true
                }
            },
            citas: {
                take: 5,
                orderBy: {
                    fechaCita: 'desc'
                },
                include: {
                    paciente: true
                }
            }
        }
    });

    if (!doctor) {
        notFound();
    }

    // Transform for the Form
    const formattedDoctor = {
        id: Number(doctor.empleadoId),
        license: doctor.licenciaProfesional,
        user: {
            name: `${doctor.empleado.nombres} ${doctor.empleado.apellidos}`,
            email: doctor.empleado.usuario?.email || ""
        },
        speciality: {
            name: doctor.especialidad.nombre
        }
    };

    return (
        <DoctorEditForm doctor={formattedDoctor} />
    );
}
