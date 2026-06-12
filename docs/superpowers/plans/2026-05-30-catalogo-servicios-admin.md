# Catálogo de Servicios (Lab + Imagenología) — Panel Admin

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al administrador crear y editar exámenes de laboratorio e imagenología (nombre, descripción, precio, activo) desde el panel admin con la estética liquid glass existente.

**Architecture:** Server Components (Next.js App Router) para las páginas con SSR de datos; Client Components para los modales y acciones interactivas. Las APIs PATCH nuevas en `[id]/route.ts` cubren edición y toggle de activo. No se usa Domain/Application layer (consistente con el patrón ya establecido en laboratorio/imagenología).

**Tech Stack:** Next.js 14 App Router, Prisma (con cast `as any` para modelos snake_case), Zod, Tailwind CSS, Lucide React.

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Modificar | `src/app/api/laboratorio/examenes/route.ts` | GET acepta `?todos=true` para devolver también inactivos |
| **Crear** | `src/app/api/laboratorio/examenes/[id]/route.ts` | PATCH: editar/toggle-activo de un examen de lab |
| Modificar | `src/app/api/imagenologia/examenes/route.ts` | GET acepta `?todos=true` |
| **Crear** | `src/app/api/imagenologia/examenes/[id]/route.ts` | PATCH: editar/toggle-activo de un examen de img |
| Modificar | `src/app/admin/AdminLayout.tsx` | Añadir "Servicios" al nav bajo "Clínica" |
| **Crear** | `src/app/admin/servicios/page.tsx` | Página servidor: tabs Lab/Img + tabla de exámenes |
| **Crear** | `src/app/admin/servicios/ExamenModal.tsx` | Componente cliente: modal crear/editar (controlled) |
| **Crear** | `src/app/admin/servicios/CreateExamenButton.tsx` | Componente cliente: botón "Nuevo" + abre ExamenModal |
| **Crear** | `src/app/admin/servicios/ExamenAcciones.tsx` | Componente cliente: editar + activar/desactivar por fila |

---

## Task 1: Extender GET de lab para incluir inactivos

**Files:**
- Modify: `src/app/api/laboratorio/examenes/route.ts`

- [ ] **Paso 1: Reemplazar el GET existente**

Localiza el bloque `export async function GET` en el archivo y reemplázalo por:

```typescript
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const todos = searchParams.get("todos") === "true";

        const examenes = await (prisma as any).examenLaboratorio.findMany({
            where: todos ? undefined : { activo: true },
            select: { examenId: true, nombre: true, descripcion: true, precio: true, activo: true },
            orderBy: { nombre: "asc" },
        });

        return NextResponse.json(
            examenes.map((e: any) => ({
                examenId:    e.examenId.toString(),
                nombre:      e.nombre,
                descripcion: e.descripcion ?? null,
                precio:      Number(e.precio || 0),
                activo:      e.activo,
            }))
        );
    } catch (error) {
        console.error("Error fetching examenes lab:", error);
        return NextResponse.json({ error: "Error al cargar exámenes" }, { status: 500 });
    }
}
```

- [ ] **Paso 2: Verificar que el servidor no arroje errores**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Resultado esperado: ningún error relacionado con este archivo.

- [ ] **Paso 3: Commit**

```bash
git add src/app/api/laboratorio/examenes/route.ts
git commit -m "feat(api): lab examenes GET acepta ?todos=true para admin"
```

---

## Task 2: Crear endpoint PATCH para exámenes de laboratorio

**Files:**
- Create: `src/app/api/laboratorio/examenes/[id]/route.ts`

- [ ] **Paso 1: Crear el archivo con el endpoint PATCH**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { z } from "zod";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const updateSchema = z.object({
    nombre:      z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    descripcion: z.string().nullable().optional(),
    precio:      z.number().min(0, "El precio no puede ser negativo").optional(),
    activo:      z.boolean().optional(),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const examenId = BigInt(id);
        const body = await req.json();
        const result = updateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.format() },
                { status: 400 }
            );
        }

        if (result.data.nombre) {
            const existing = await (prisma as any).examenLaboratorio.findFirst({
                where: { nombre: result.data.nombre, NOT: { examenId } },
            });
            if (existing) {
                return NextResponse.json(
                    { error: "Ya existe un examen con este nombre" },
                    { status: 400 }
                );
            }
        }

        const updated = await (prisma as any).examenLaboratorio.update({
            where: { examenId },
            data: result.data,
        });

        return NextResponse.json({ success: true, examenId: updated.examenId.toString() });
    } catch (error) {
        console.error("Error updating examen lab:", error);
        return NextResponse.json({ error: "Error al actualizar examen" }, { status: 500 });
    }
}
```

- [ ] **Paso 2: Verificar build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Paso 3: Commit**

```bash
git add src/app/api/laboratorio/examenes/[id]/route.ts
git commit -m "feat(api): PATCH /api/laboratorio/examenes/[id] para editar examen de lab"
```

---

## Task 3: Extender GET de imagenología e implementar PATCH

**Files:**
- Modify: `src/app/api/imagenologia/examenes/route.ts`
- Create: `src/app/api/imagenologia/examenes/[id]/route.ts`

- [ ] **Paso 1: Reemplazar GET en imagenología**

En `src/app/api/imagenologia/examenes/route.ts`, reemplaza `export async function GET`:

```typescript
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const todos = searchParams.get("todos") === "true";

        const examenes = await (prisma as any).examenImagenologia.findMany({
            where: todos ? undefined : { activo: true },
            select: { examenId: true, nombre: true, descripcion: true, precio: true, activo: true },
            orderBy: { nombre: "asc" },
        });

        return NextResponse.json(
            examenes.map((e: any) => ({
                examenId:    e.examenId.toString(),
                nombre:      e.nombre,
                descripcion: e.descripcion ?? null,
                precio:      Number(e.precio || 0),
                activo:      e.activo,
            }))
        );
    } catch (error) {
        console.error("Error fetching examenes img:", error);
        return NextResponse.json({ error: "Error al cargar estudios radiológicos" }, { status: 500 });
    }
}
```

- [ ] **Paso 2: Crear `src/app/api/imagenologia/examenes/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { z } from "zod";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const updateSchema = z.object({
    nombre:      z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    descripcion: z.string().nullable().optional(),
    precio:      z.number().min(0, "El precio no puede ser negativo").optional(),
    activo:      z.boolean().optional(),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const examenId = BigInt(id);
        const body = await req.json();
        const result = updateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.format() },
                { status: 400 }
            );
        }

        if (result.data.nombre) {
            const existing = await (prisma as any).examenImagenologia.findFirst({
                where: { nombre: result.data.nombre, NOT: { examenId } },
            });
            if (existing) {
                return NextResponse.json(
                    { error: "Ya existe un estudio con este nombre" },
                    { status: 400 }
                );
            }
        }

        const updated = await (prisma as any).examenImagenologia.update({
            where: { examenId },
            data: result.data,
        });

        return NextResponse.json({ success: true, examenId: updated.examenId.toString() });
    } catch (error) {
        console.error("Error updating examen img:", error);
        return NextResponse.json({ error: "Error al actualizar estudio" }, { status: 500 });
    }
}
```

- [ ] **Paso 3: Verificar build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Paso 4: Commit**

```bash
git add src/app/api/imagenologia/examenes/route.ts src/app/api/imagenologia/examenes/[id]/route.ts
git commit -m "feat(api): extender GET y añadir PATCH para imagenologia examenes"
```

---

## Task 4: Añadir "Servicios" al sidebar de Admin

**Files:**
- Modify: `src/app/admin/AdminLayout.tsx`

- [ ] **Paso 1: Añadir el import de FlaskConical**

En el bloque de imports de `lucide-react` (línea ~8), añade `FlaskConical`:

```typescript
import {
    LayoutDashboard,
    Users,
    UserCog,
    Calendar,
    Activity,
    BarChart3,
    FileText,
    Settings,
    LogOut,
    Clock,
    ShoppingCart,
    Award,
    Briefcase,
    Shield,
    Siren,
    Heart,
    Menu,
    ChevronRight,
    FlaskConical,
} from "lucide-react";
```

- [ ] **Paso 2: Añadir item "Servicios" al array navigation**

En el array `navigation` (línea ~51), añade el nuevo item bajo la sección "Clínica", después de "Especialidades":

```typescript
{ name: "Especialidades", href: "/admin/especialidades", icon: Activity, section: "Clínica" },
{ name: "Servicios", href: "/admin/servicios", icon: FlaskConical, section: "Clínica" },
```

El array completo de la sección "Clínica" quedará:
```typescript
{ name: "Citas Médicas", href: "/admin/citas", icon: Calendar, section: "Clínica" },
{ name: "Especialidades", href: "/admin/especialidades", icon: Activity, section: "Clínica" },
{ name: "Servicios", href: "/admin/servicios", icon: FlaskConical, section: "Clínica" },
{ name: "Aseguradoras", href: "/admin/aseguradoras", icon: Shield, section: "Clínica" },
{ name: "Emergencias", href: "/admin/emergencias", icon: Siren, section: "Clínica" },
{ name: "Enfermería", href: "/admin/enfermeria", icon: Heart, section: "Clínica" },
```

- [ ] **Paso 3: Commit**

```bash
git add src/app/admin/AdminLayout.tsx
git commit -m "feat(admin): añadir Servicios al sidebar de administración"
```

---

## Task 5: Crear componente ExamenModal

**Files:**
- Create: `src/app/admin/servicios/ExamenModal.tsx`

Este componente controlled recibe el examen a editar (o nada para crear), el módulo, y callbacks. No maneja su propio estado open/close.

- [ ] **Paso 1: Crear el archivo**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";

export interface ExamenData {
    examenId: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    activo: boolean;
}

interface ExamenModalProps {
    isOpen: boolean;
    onClose: () => void;
    modulo: "laboratorio" | "imagenologia";
    examen?: ExamenData;
}

export function ExamenModal({ isOpen, onClose, modulo, examen }: ExamenModalProps) {
    const router = useRouter();
    const isEditing = !!examen;

    const [nombre, setNombre]         = useState(examen?.nombre ?? "");
    const [descripcion, setDescripcion] = useState(examen?.descripcion ?? "");
    const [precio, setPrecio]         = useState(examen?.precio?.toString() ?? "");
    const [error, setError]           = useState<string | null>(null);
    const [loading, setLoading]       = useState(false);

    if (!isOpen) return null;

    const moduloLabel = modulo === "laboratorio" ? "Examen de Laboratorio" : "Estudio de Imagenología";
    const apiBase = `/api/${modulo}/examenes`;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const precioNum = parseFloat(precio);
        if (isNaN(precioNum) || precioNum < 0) {
            setError("El precio debe ser un número válido mayor o igual a 0.");
            return;
        }

        setLoading(true);
        try {
            const url    = isEditing ? `${apiBase}/${examen!.examenId}` : apiBase;
            const method = isEditing ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre:      nombre.trim(),
                    descripcion: descripcion.trim() || null,
                    precio:      precioNum,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Error desconocido.");
                return;
            }

            router.refresh();
            onClose();
        } catch {
            setError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-[0_24px_64px_0_rgba(0,0,0,0.12)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">
                            {isEditing ? "Editar" : "Nuevo"} {moduloLabel}
                        </h2>
                        <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-widest">
                            {modulo}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-50/80 border border-red-200/60 text-sm font-bold text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                            minLength={2}
                            placeholder="Ej. Hemograma completo"
                            className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Descripción <span className="text-gray-300 font-medium">(opcional)</span>
                        </label>
                        <textarea
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            rows={3}
                            placeholder="Descripción breve del examen o estudio"
                            className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Precio (S/)
                        </label>
                        <input
                            type="number"
                            value={precio}
                            onChange={e => setPrecio(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 text-sm font-bold text-gray-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-lime-500 hover:bg-lime-600 disabled:opacity-50 text-sm font-black text-white shadow-[0_4px_12px_rgba(132,204,22,0.4)] transition-all flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {isEditing ? "Guardar cambios" : "Crear"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
```

- [ ] **Paso 2: Verificar que TypeScript no arroje errores**

```bash
npx tsc --noEmit 2>&1 | grep "servicios" | head -20
```

Resultado esperado: sin errores en este archivo.

- [ ] **Paso 3: Commit**

```bash
git add src/app/admin/servicios/ExamenModal.tsx
git commit -m "feat(admin): componente ExamenModal para crear/editar exámenes"
```

---

## Task 6: Crear CreateExamenButton

**Files:**
- Create: `src/app/admin/servicios/CreateExamenButton.tsx`

- [ ] **Paso 1: Crear el archivo**

```typescript
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ExamenModal } from "./ExamenModal";

interface CreateExamenButtonProps {
    modulo: "laboratorio" | "imagenologia";
}

export function CreateExamenButton({ modulo }: CreateExamenButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-lime-500 hover:bg-lime-600 text-white text-sm font-black shadow-[0_4px_12px_rgba(132,204,22,0.4)] hover:scale-[1.02] transition-all duration-200"
            >
                <Plus size={18} />
                Nuevo
            </button>

            <ExamenModal
                isOpen={open}
                onClose={() => setOpen(false)}
                modulo={modulo}
            />
        </>
    );
}
```

- [ ] **Paso 2: Commit**

```bash
git add src/app/admin/servicios/CreateExamenButton.tsx
git commit -m "feat(admin): CreateExamenButton para catálogo de servicios"
```

---

## Task 7: Crear ExamenAcciones

**Files:**
- Create: `src/app/admin/servicios/ExamenAcciones.tsx`

Este componente maneja editar (abre modal) y activar/desactivar (PATCH directo).

- [ ] **Paso 1: Crear el archivo**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { ExamenModal, ExamenData } from "./ExamenModal";

interface ExamenAccionesProps {
    examen: ExamenData;
    modulo: "laboratorio" | "imagenologia";
}

export function ExamenAcciones({ examen, modulo }: ExamenAccionesProps) {
    const router = useRouter();
    const [editOpen, setEditOpen]     = useState(false);
    const [toggling, setToggling]     = useState(false);

    async function handleToggleActivo() {
        setToggling(true);
        try {
            await fetch(`/api/${modulo}/examenes/${examen.examenId}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ activo: !examen.activo }),
            });
            router.refresh();
        } finally {
            setToggling(false);
        }
    }

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={() => setEditOpen(true)}
                    title="Editar"
                    className="p-2 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 hover:border-blue-200 text-gray-400 hover:text-blue-600 transition-all"
                >
                    <Pencil size={16} />
                </button>

                <button
                    onClick={handleToggleActivo}
                    disabled={toggling}
                    title={examen.activo ? "Desactivar" : "Activar"}
                    className={`p-2 rounded-xl border transition-all ${
                        examen.activo
                            ? "bg-white/50 border-white/60 hover:bg-red-50/80 hover:border-red-200 text-gray-400 hover:text-red-500"
                            : "bg-white/50 border-white/60 hover:bg-green-50/80 hover:border-green-200 text-gray-400 hover:text-green-600"
                    }`}
                >
                    {toggling ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : examen.activo ? (
                        <ToggleRight size={16} />
                    ) : (
                        <ToggleLeft size={16} />
                    )}
                </button>
            </div>

            <ExamenModal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                modulo={modulo}
                examen={examen}
            />
        </>
    );
}
```

- [ ] **Paso 2: Commit**

```bash
git add src/app/admin/servicios/ExamenAcciones.tsx
git commit -m "feat(admin): ExamenAcciones con editar y toggle-activo"
```

---

## Task 8: Crear la página principal de Servicios

**Files:**
- Create: `src/app/admin/servicios/page.tsx`

Página servidor que:
1. Lee `searchParams.modulo` (por defecto `"laboratorio"`)
2. Hace fetch al API correspondiente con `?todos=true`
3. Renderiza header + tabs + tabla + paginación

- [ ] **Paso 1: Crear el archivo**

```typescript
import { NextRequest } from "next/server";
import Link from "next/link";
import { FlaskConical, ScanLine } from "lucide-react";
import { CreateExamenButton } from "./CreateExamenButton";
import { ExamenAcciones } from "./ExamenAcciones";

type Modulo = "laboratorio" | "imagenologia";

interface Examen {
    examenId: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    activo: boolean;
}

async function fetchExamenes(modulo: Modulo): Promise<Examen[]> {
    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/${modulo}/examenes?todos=true`, {
        cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function ServiciosPage({
    searchParams,
}: {
    searchParams: Promise<{ modulo?: string }>;
}) {
    const { modulo: moduloParam } = await searchParams;
    const modulo: Modulo = moduloParam === "imagenologia" ? "imagenologia" : "laboratorio";

    const examenes = await fetchExamenes(modulo);

    const tabs: { key: Modulo; label: string; icon: React.ReactNode }[] = [
        { key: "laboratorio",  label: "Laboratorio",   icon: <FlaskConical size={16} /> },
        { key: "imagenologia", label: "Imagenología",  icon: <ScanLine size={16} /> },
    ];

    const moduloLabel = modulo === "laboratorio" ? "Laboratorio" : "Imagenología";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Catálogo de Servicios
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Gestiona los exámenes y estudios disponibles con sus precios.
                    </p>
                </div>
                <CreateExamenButton modulo={modulo} />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-white/50 w-fit shadow-sm">
                {tabs.map(tab => (
                    <Link
                        key={tab.key}
                        href={`/admin/servicios?modulo=${tab.key}`}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${
                            modulo === tab.key
                                ? "bg-lime-500 text-white shadow-[0_4px_12px_rgba(132,204,22,0.4)] scale-[1.02]"
                                : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Tabla */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-white/30 border-b border-white/40">
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">ID</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Nombre</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Descripción</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Precio</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Estado</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                        {examenes.map(examen => (
                            <tr key={examen.examenId} className="hover:bg-white/60 transition-colors group">
                                <td className="px-6 py-5 text-sm font-bold text-gray-400 whitespace-nowrap">
                                    #{examen.examenId.padStart(4, "0")}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-sm font-black text-gray-900 tracking-tight">
                                        {examen.nombre}
                                    </span>
                                </td>
                                <td className="px-6 py-5 max-w-xs">
                                    <span className="text-sm text-gray-500 line-clamp-2">
                                        {examen.descripcion ?? <span className="text-gray-300 italic">Sin descripción</span>}
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-sm font-black text-gray-900">
                                        S/ {examen.precio.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${
                                        examen.activo
                                            ? "bg-green-50/50 text-green-700 border-green-200/50"
                                            : "bg-red-50/50 text-red-700 border-red-200/50"
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${examen.activo ? "bg-green-500" : "bg-red-500"}`} />
                                        {examen.activo ? "ACTIVO" : "INACTIVO"}
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                    <ExamenAcciones examen={examen} modulo={modulo} />
                                </td>
                            </tr>
                        ))}
                        {examenes.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        No hay {moduloLabel.toLowerCase()} registrados aún.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="bg-white/20 px-6 py-4 border-t border-white/40">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {examenes.length} {moduloLabel.toLowerCase()} registrados
                    </p>
                </div>
            </div>
        </div>
    );
}
```

> **Nota sobre el fetch:** En Next.js App Router los Server Components pueden hacer fetch a sus propias API routes usando la URL absoluta. La variable `process.env.NEXTAUTH_URL ?? ...` cubre prod (Vercel) y desarrollo local.

- [ ] **Paso 2: Build final**

```bash
npm run build 2>&1 | tail -30
```

Resultado esperado: build exitoso sin errores de TypeScript.

- [ ] **Paso 3: Arrancar dev y verificar visualmente**

```bash
npm run dev
```

Navegar a `http://localhost:3000/admin/servicios` con rol ADMIN y verificar:
- [ ] Tab "Laboratorio" activo por defecto muestra tabla
- [ ] Tab "Imagenología" cambia el contenido
- [ ] Botón "Nuevo" abre el modal glassmorphic
- [ ] Se puede crear un examen con nombre, descripción y precio
- [ ] El examen aparece en la tabla tras crearlo
- [ ] Botón lápiz por fila abre el modal con datos pre-rellenados
- [ ] Se puede editar y guardar cambios
- [ ] Botón toggle cambia el estado ACTIVO/INACTIVO sin recargar la página completa (router.refresh())
- [ ] El sidebar muestra "Servicios" bajo la sección "Clínica"

- [ ] **Paso 4: Commit final**

```bash
git add src/app/admin/servicios/page.tsx
git commit -m "feat(admin): página Catálogo de Servicios con tabs Lab/Img y CRUD completo"
```

---

## Checklist de verificación post-implementación

- [ ] `GET /api/laboratorio/examenes` sin params sigue devolviendo solo activos (sin romper solicitudes existentes)
- [ ] `GET /api/laboratorio/examenes?todos=true` devuelve activos e inactivos
- [ ] `PATCH /api/laboratorio/examenes/[id]` actualiza correctamente
- [ ] Igual para imagenología
- [ ] El modal cierra correctamente en Escape y en click al overlay
- [ ] El formulario valida que nombre tenga al menos 2 caracteres y precio sea >= 0
- [ ] Nombres duplicados muestran el error del servidor en el modal
- [ ] Página `servicios` aparece en el sidebar de admin con el ícono correcto
- [ ] Build de producción sin errores: `npm run build`
