
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

    return (
        <DoctorEditForm doctor={doctor} />
    );
}
