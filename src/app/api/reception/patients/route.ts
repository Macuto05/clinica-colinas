import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const whereClause: Prisma.PacienteWhereInput = {};

        if (search) {
            whereClause.OR = [
                { nombres: { contains: search, mode: 'insensitive' } },
                { apellidos: { contains: search, mode: 'insensitive' } },
                { documentoIdentidad: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [patients, total] = await Promise.all([
            prisma.paciente.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { pacienteId: 'asc' }, // Show Oldest first (1, 2, 3...)
                include: {
                    usuario: {
                        select: { email: true }
                    }
                }
            }),
            prisma.paciente.count({ where: whereClause })
        ]);

        const formatted = patients.map(p => ({
            id: p.pacienteId.toString(),
            nombres: p.nombres,
            apellidos: p.apellidos,
            documento: p.documentoIdentidad,
            telefono: p.telefono,
            contactEmail: p.correo || 'N/A',
            accessEmail: p.usuario?.email || 'N/A',
            fechaNacimiento: p.fechaNacimiento,
            sexo: p.sexo,
            direccion: p.direccion
        }));

        return NextResponse.json({
            data: formatted,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching patients:", error);
        return NextResponse.json({ error: "Error al obtener pacientes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { nombres, apellidos, documentoIdentidad, telefono, correo, fechaNacimiento, direccion, sexo, correoAcceso, password } = body;

        // Basic Validation
        if (!nombres || !apellidos || !documentoIdentidad) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Check Duplicates for Patient (Document)
        const existingPatient = await prisma.paciente.findUnique({
            where: { documentoIdentidad }
        });

        if (existingPatient) {
            return NextResponse.json({ error: "Ya existe un paciente con este documento" }, { status: 400 });
        }

        let newUsuarioId: bigint | null = null;

        // Create User Account if requested
        if (correoAcceso && password) {
            // Check Validation
            if (password.length < 8) {
                return NextResponse.json({ error: "La contraseña es muy corta" }, { status: 400 });
            }

            // Check if User Email exists
            const existingUser = await prisma.usuario.findUnique({
                where: { email: correoAcceso }
            });

            if (existingUser) {
                return NextResponse.json({ error: "El correo de acceso ya está registrado" }, { status: 400 });
            }

            // Hash Password
            const bcrypt = require('bcryptjs'); // Dynamically import to avoid top-level issues if types missing
            const hashedPassword = await bcrypt.hash(password, 10);

            // Get 'PACIENTE' Role ID
            const role = await prisma.rol.findUnique({ where: { nombre: 'PACIENTE' } });
            if (!role) {
                return NextResponse.json({ error: "Rol PACIENTE no configurado" }, { status: 500 });
            }

            // Create User inside transaction
            // We'll do it sequentially for now since we need ID
            const neUser = await prisma.usuario.create({
                data: {
                    email: correoAcceso,
                    passwordHash: hashedPassword,
                    rolId: role.rolId,
                    estado: 'ACTIVO'
                }
            });
            newUsuarioId = neUser.usuarioId;
        }

        // Create Patient linked to User (if created)
        const newPatient = await prisma.paciente.create({
            data: {
                nombres,
                apellidos,
                documentoIdentidad,
                telefono,
                correo, // Contact Email
                fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
                direccion,
                sexo,
                estado: 'ACTIVO',
                usuarioId: newUsuarioId
            }
        });

        return NextResponse.json({
            success: true,
            patient: {
                id: newPatient.pacienteId.toString(),
                nombres: newPatient.nombres
            }
        });

    } catch (error) {
        console.error("Error creating patient:", error);
        return NextResponse.json({
            error: "Error al crear paciente",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
