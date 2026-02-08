import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { cookies } from "next/headers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Verify Session
        // Note: next/headers cookies() is async in newer versions
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        let userId = undefined;
        let userRole = undefined;
        let patientId = undefined;

        if (token) {
            // Dynamic import to avoid edge runtime issues if any, though standard import is fine usually
            const { JWTService } = await import('@/infrastructure/services/JWTService');
            const payload = await JWTService.verifyToken(token);
            if (payload) {
                userId = payload.userId;
                userRole = payload.role;
                patientId = payload.patientId;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!id) {
            return NextResponse.json({ error: "ID de cita requerido" }, { status: 400 });
        }

        const app = await prisma.citaMedica.findUnique({
            where: { citaId: BigInt(id) },
            include: {
                paciente: true,
                medico: {
                    include: {
                        empleado: true, // Needed for Names
                        especialidad: true // Needed for Specialty
                    }
                },
                diagnostico: true,
                receta: {
                    include: { detalles: true }
                },
                ordenes: true
            }
        });

        if (!app) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }

        // Ownership Check
        // If user is PATIENT, they must own the appointment
        if (userRole === 'PACIENTE') {
            // We need to verify if the user is linked to this patient.
            // Option 1: payload has patientId
            // Option 2: fetch User -> Patient link

            if (!patientId) {
                // Fetch from DB if not in token
                const userRecord = await prisma.usuario.findUnique({
                    where: { usuarioId: BigInt(userId) },
                    include: { paciente: true }
                });
                if (userRecord?.paciente) {
                    patientId = userRecord.paciente.pacienteId;
                }
            }

            if (!patientId || BigInt(patientId) !== app.pacienteId) {
                return NextResponse.json({ error: "No tienes permiso para ver esta cita" }, { status: 403 });
            }
        }

        // Format Response (Simplified for Patient View)
        const formatted = {
            id: app.citaId.toString(),
            doctor: {
                nombre: app.medico.empleado
                    ? `${app.medico.empleado.nombres} ${app.medico.empleado.apellidos}`
                    : 'Dr. No Asignado',
                especialidad: app.medico.especialidad.nombre || 'General'
            },
            hora: (() => {
                const d = new Date(app.horaInicio);
                const hours = d.getUTCHours();
                const minutes = d.getUTCMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const formattedHour = hours % 12 || 12;
                return `${formattedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            })(),
            fecha: app.fechaCita,
            motivo: app.motivoConsulta,
            estado: app.estadoCita,
            tipo: app.tipoCita,
            diagnostico: app.diagnostico ? {
                descripcion: app.diagnostico.descripcion,
                notas: app.diagnostico.notas
            } : null,
            receta: app.receta ? {
                detalles: app.receta.detalles.map(d => ({
                    medicamento: d.medicamento,
                    dosis: d.dosis,
                    frecuencia: d.frecuencia,
                    duracion: d.duracion,
                    instrucciones: d.instrucciones
                }))
            } : null,
            ordenes: app.ordenes ? app.ordenes.map(o => ({
                tipo: o.tipo,
                estudio: o.estudio,
            })) : []
        };

        return NextResponse.json(formatted);

    } catch (error) {
        console.error("Error fetching patient appointment detail:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
