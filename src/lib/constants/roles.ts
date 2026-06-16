/**
 * Centralized role constants for Clínica Colinas.
 * Eliminates magic strings across middleware, AuthContext, and API routes.
 */

/** All valid role variants for cashier access */
export const CAJA_ROLES = [
    "CAJA",
    "CAJA Y FACTURACION",
    "CAJA Y FACTURACIÓN",
    "CAJA/FACTURACION",
    "CAJA/FACTURACIÓN",
] as const;

/** All valid role variants for almacen/warehouse access (handles DB accent inconsistency) */
export const ALMACEN_ROLES = [
    "ALMACEN",
    "ALMACÉN",
] as const;

/** Roles that get ADMIN-level access */
export const ADMIN_ROLES = ["ADMIN"] as const;

/** Check if a role string matches one of the CAJA variants */
export function isCajaRole(role: string): boolean {
    return (CAJA_ROLES as readonly string[]).includes(role);
}

/** Check if a role string matches one of the ALMACEN variants */
export function isAlmacenRole(role: string): boolean {
    return (ALMACEN_ROLES as readonly string[]).includes(role);
}

/** Check if a role string matches ADMIN */
export function isAdminRole(role: string): boolean {
    return role === "ADMIN";
}

/** All possible system roles */
export const ALL_ROLES = [
    "ADMIN",
    "MEDICO",
    "RECEPCION",
    "ALMACEN",
    ...CAJA_ROLES,
    "LABORATORIO",
    "IMAGENOLOGIA",
    "FARMACIA",
    "ENFERMERIA",
    "PACIENTE",
] as const;
