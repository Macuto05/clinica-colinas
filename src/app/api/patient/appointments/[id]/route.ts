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
                ordenEstudio: {
                    include: { detalles: true }
                }
            } as any
        });

        if (!app) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }

        // Ownership Check — this is a patient-facing endpoint
        if (userRole === 'PACIENTE') {
            if (!patientId) {
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
        } else if (userRole === 'MEDICO') {
            // Doctors can only see appointments assigned to them
            const medicoRecord = await (prisma as any).medico.findFirst({
                where: { empleado: { usuarioId: BigInt(userId) } },
                select: { medicoId: true }
            });
            if (!medicoRecord || medicoRecord.medicoId !== app.medicoId) {
                return NextResponse.json({ error: "No tienes permiso para ver esta cita" }, { status: 403 });
            }
        } else if (userRole !== 'ADMIN' && userRole !== 'RECEPCION') {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        // Format Response (Simplified for Patient View)
        const formatted = {
            id: app.citaId.toString(),
            doctor: {
                nombre: (app as any).medico?.empleado
                    ? `${(app as any).medico.empleado.nombres} ${(app as any).medico.empleado.apellidos}`
                    : 'Dr. No Asignado',
                especialidad: (app as any).medico?.especialidad?.nombre || 'General'
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
            diagnostico: (app as any).diagnostico ? {
                descripcion: (app as any).diagnostico.descripcion,
                notas: (app as any).diagnostico.notas
            } : null,
            receta: (app as any).receta ? {
                detalles: (app as any).receta.detalles.map((d: any) => ({
                    medicamento: d.medicamento,
                    dosis: d.dosis,
                    frecuencia: d.frecuencia,
                    duracion: d.duracion,
                    instrucciones: d.instrucciones
                }))
            } : null,
            ordenes: (app as any).ordenEstudio
                ? (app as any).ordenEstudio.detalles.map((d: any) => ({
                    estudio: d.estudio,
                    tipo: d.tipo,
                }))
                : []
        };

        return NextResponse.json(formatted);

    } catch (error) {
        console.error("Error fetching patient appointment detail:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
