---
name: panel-layout-design
description: Standard layout pattern for role-based panels in Clínica Colinas (Admin-inspired).
---

# Clínica Colinas — Estándar de Layout de Paneles

Todos los paneles de roles (Admin, Recepción, Enfermería, Farmacia, etc.) deben seguir este estándar visual y estructural para garantizar consistencia en la experiencia de usuario (Liquid Glass aesthetic).

## 1. Estructura de Contenedor Principal
El contenedor base debe usar el gradiente característico y una disposición flex.

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-100 via-green-50/30 to-lime-50/30 flex transition-colors duration-300">
  {/* Sidebar */}
  <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] hidden lg:flex overflow-hidden flex flex-col">
    {/* Contenido Sidebar */}
  </aside>

  {/* Área de Contenido */}
  <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
    {/* Header & Main */}
  </div>
</div>
```

## 2. Sidebar (Navegación Lateral)
- **Top:** Logo de Clínica Colinas (Imagen: `/logo-clinicas-colina.jpg`) centrado en un contenedor de altura fija (`h-16`).
- **Body:** Lista de enlaces (`NavItem`) agrupados por categorías con tipografía mono/bold pequeña para los títulos de sección.
- **Botón NavItem:**
  - `rounded-lg text-gray-600 hover:bg-white/60 hover:text-[#a1db4b] hover:shadow-sm transition-all duration-300 group`
  - Debe incluir un icono de `lucide-react` con efecto de escalado/rotación suave al hacer hover.
- **Bottom:** Perfil del usuario actual y botón de "Cerrar Sesión" (rojo).

## 3. Cabecera y Tasa BCV
- En Desktop, la cabecera es transparente/flotante con el `ExchangeRateWidget` alineado a la derecha.
- En Mobile, se usa una cabecera adhesiva (`sticky`) con `backdrop-blur-md` y el título del panel.

## 4. Estética Visual (Liquid Glass)
- **Fondos:** `bg-white/60` o `bg-white/70` con `backdrop-blur-xl`.
- **Bordes:** `border-white/40` o `border-white/50`.
- **Sombras:** Suaves y difusas (`shadow-sm`, `shadow-md`).
- **Tipografía:** Utilizar `tracking-tight` y pesos `font-black` para títulos principales, y `font-bold` para elementos de navegación.

## 5. Implementación Rápida de NavItem
```tsx
function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-white/60 hover:text-[#a1db4b] hover:shadow-sm transition-all duration-300 group"
        >
            <div className="transition-transform group-hover:scale-110 group-hover:rotate-3 shrink-0">
                {icon}
            </div>
            <span className="font-bold text-sm tracking-tight truncate">{label}</span>
        </Link>
    );
}
```
