import prisma from '@/infrastructure/database/prisma/client';
import { AuditSeveridad } from '@prisma/client';
import { NextRequest } from 'next/server';

export type AuditModulo =
  | 'AUTH'
  | 'RECEPCION'
  | 'CITAS'
  | 'EMERGENCIAS'
  | 'LABORATORIO'
  | 'IMAGENOLOGIA'
  | 'ENFERMERIA'
  | 'FARMACIA'
  | 'ALMACEN'
  | 'CAJA'
  | 'ADMIN'
  | 'PACIENTES'
  | 'MEDICOS';

export interface AuditParams {
  usuarioId?: bigint | number | null;
  nombreUsuario: string;
  rolUsuario: string;
  modulo: AuditModulo;
  accion: string;
  descripcion: string;
  severidad?: AuditSeveridad;
  entidadTipo?: string;
  entidadId?: string | number | bigint;
  metadatos?: Record<string, unknown>;
  req?: NextRequest;
}

export async function logAuditoria(params: AuditParams): Promise<void> {
  try {
    const ipOrigen = params.req
      ? params.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        params.req.headers.get('x-real-ip') ??
        null
      : null;

    await prisma.registroAuditoria.create({
      data: {
        usuarioId: params.usuarioId ? BigInt(params.usuarioId) : null,
        nombreUsuario: params.nombreUsuario,
        rolUsuario: params.rolUsuario,
        modulo: params.modulo,
        accion: params.accion,
        descripcion: params.descripcion,
        severidad: params.severidad ?? AuditSeveridad.INFO,
        entidadTipo: params.entidadTipo ?? null,
        entidadId: params.entidadId != null ? String(params.entidadId) : null,
        metadatos: params.metadatos ?? null,
        ipOrigen,
      },
    });
  } catch {
    // El log de auditoría nunca debe romper el flujo principal
  }
}
