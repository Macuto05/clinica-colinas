# Decimal Supply Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir el registro de cantidades decimales de insumos (ej. 2.5 ampollas) en hospitalizado y cirugía, corrigiendo simultáneamente un bug preexistente de FEFO multi-lote, con la regla de que el inventario descuenta el decimal exacto pero la facturación al paciente siempre redondea hacia arriba (Math.ceil).

**Architecture:** Cuatro cambios quirúrgicos en 4 archivos. La base de datos ya soporta Decimal(14,2) en todos los campos relevantes — no hay migración. El backend necesita: (1) corregir el FEFO de retiro-insumo para que consuma de múltiples lotes correctamente, y (2) aplicar Math.ceil al crear CargoCuentaPaciente en ambos flujos. El frontend necesita desbloquear los inputs que hoy rechazan decimales vía regex y parseInt.

**Tech Stack:** Next.js 14 App Router, Prisma 7, PostgreSQL, TypeScript, React

---

## Contexto y Reglas de Negocio

Antes de tocar código, entender estas reglas es crítico:

**Regla 1 — Inventario usa decimal exacto:**
- Enfermera usa 2.5 ampollas → `stock.cantidad_actual` baja 2.5
- El 0.5 restante queda implícito en el conteo decimal del stock (9.5 ampollas = 9 completas + 1 media abierta en físico)

**Regla 2 — Facturación usa techo (Math.ceil):**
- 2.5 usadas → `cargo_cuenta_paciente.cantidad = 3` → paciente paga 3
- 3.0 usadas → `cargo_cuenta_paciente.cantidad = 3` → paciente paga 3 (exacto no cambia)
- 0.5 usadas → `cargo_cuenta_paciente.cantidad = 1` → paciente paga 1

**Regla 3 — FEFO multi-lote (fix preexistente):**
- Si el lote más viejo tiene 3 unidades y se usan 3.4, tomar 3 de ese lote y 0.4 del siguiente lote más viejo
- Nunca dejar un lote en negativo

**Los dos flujos distintos:**
- **Hospitalizado:** Enfermera retira directamente del almacén. API: `POST /api/emergency/[id]/retiro-insumo`. No hay reconciliación posterior. El cargo se crea al momento del retiro.
- **Cirugía:** Enfermera solicita, farmacia despacha completo, al cerrar farmacia reconcilia (ingresa cuánto se usó realmente). El cargo se crea en la reconciliación, no en el despacho.

---

## Mapa de archivos

| Archivo | Tipo de cambio | Responsabilidad |
|---|---|---|
| `src/app/api/emergency/[id]/retiro-insumo/route.ts` | **Modificar** | FEFO multi-lote + Math.ceil en cargo (hospitalizado) |
| `src/app/api/farmacia/solicitudes/[id]/reconciliar/route.ts` | **Modificar** | Math.ceil en cargo (cirugía) |
| `src/app/enfermeria/components/GestionPacientePanel.tsx` | **Modificar** | Inputs decimales + parseFloat (hospitalizado + quirófano) |
| `src/app/farmacia/components/InboxSolicitudes.tsx` | **Modificar** | step="any" en input de reconciliación |

---

## Task 1: Fix FEFO multi-lote + Math.ceil en retiro-insumo (hospitalizado)

**Files:**
- Modify: `src/app/api/emergency/[id]/retiro-insumo/route.ts` (sección de transacción, líneas 106–184)

**Problema actual:** El código usa `findFirst` y descuenta TODO del único lote encontrado. Si el lote tiene 3 unidades y la enfermera retira 3.4, ese lote queda en -0.4. Este bug existe hoy con enteros también — los decimales solo lo hacen más probable.

**Problema adicional actual:** `CargoCuentaPaciente.cantidad = cantidadNum` (decimal exacto), cuando debe ser `Math.ceil(cantidadNum)` para facturación correcta.

- [ ] **Step 1: Localizar la transacción completa en retiro-insumo**

Abrir `src/app/api/emergency/[id]/retiro-insumo/route.ts`. Identificar el bloque `await (prisma as any).$transaction(async (tx: any) => { ... })` que empieza en la línea ~106. El bloque actual hace:
1. `findFirst` del lote más viejo
2. Crea `MovimientoInventario`
3. Crea UN solo `MovimientoDetalle` con `cantidad: cantidadNum` y el lote encontrado
4. Decrementa `Stock` agregado
5. Decrementa `StockLote` del único lote
6. Crea `CargoCuentaPaciente` con `cantidad: cantidadNum`

- [ ] **Step 2: Reemplazar todo el bloque de transacción**

Reemplazar el bloque `await (prisma as any).$transaction(async (tx: any) => { ... });` completo (líneas 106–184) con el siguiente código:

```ts
await (prisma as any).$transaction(async (tx: any) => {
    // ── FEFO multi-lote: consume de varios lotes si hace falta ────
    const stockLotesFefo = await tx.stockLote.findMany({
        where: {
            almacenId: almacenIdBig,
            cantidadActual: { gt: 0 },
            lote: { insumoId: insumoIdBig, activo: true },
        },
        include: { lote: { select: { loteId: true } } },
        orderBy: { lote: { fechaVencimiento: "asc" } },
    });

    const movimientoDetalles: { loteId: bigint | null; cantidad: number }[] = [];
    let remaining = cantidadNum;

    for (const sl of stockLotesFefo) {
        if (remaining <= 0) break;
        const available = parseFloat(sl.cantidadActual.toString());
        const toTake = Math.min(available, remaining);
        await tx.stockLote.update({
            where: { stockLoteId: sl.stockLoteId },
            data:  { cantidadActual: available - toTake },
        });
        movimientoDetalles.push({
            loteId:   sl.lote?.loteId ? BigInt(sl.lote.loteId.toString()) : null,
            cantidad: toTake,
        });
        remaining -= toTake;
    }

    // Fallback: si hay stock sin lotes asignados cubre el resto
    if (remaining > 0) {
        movimientoDetalles.push({ loteId: null, cantidad: remaining });
    }

    // ── Referencia secuencial ─────────────────────────────────────
    const countSalidas = await tx.movimientoInventario.count({
        where: { tipoMovimiento: "SALIDA", almacenId: almacenIdBig },
    });
    const numSalida      = countSalidas + 1;
    const referencia     = `SAL-ENF-${numSalida}`;
    const observacionAuto = observaciones?.trim()
        ? observaciones.trim()
        : `Retiro de insumo por enfermeria #${numSalida}`;

    // ── Movimiento de inventario ──────────────────────────────────
    const movimiento = await tx.movimientoInventario.create({
        data: {
            almacenId:      almacenIdBig,
            tipoMovimiento: "SALIDA",
            usuarioId,
            referencia,
            observaciones:  observacionAuto,
        },
    });

    // ── Detalles del movimiento (uno por lote consumido) ─────────
    for (const det of movimientoDetalles) {
        await tx.movimientoDetalle.create({
            data: {
                movimientoId: movimiento.movimientoId,
                insumoId:     insumoIdBig,
                loteId:       det.loteId,
                cantidad:     det.cantidad,
            },
        });
    }

    // ── Decremento del stock agregado (una sola vez) ──────────────
    await tx.stock.update({
        where: { uq_stock: { almacenId: almacenIdBig, insumoId: insumoIdBig } },
        data:  { cantidadActual: { decrement: cantidadNum } },
    });

    // ── Cargo al paciente: techo para facturación correcta ────────
    await tx.cargoCuentaPaciente.create({
        data: {
            emergenciaId:     BigInt(resolvedParams.id),
            citaId:           citaIdForCargo,
            tipoCargo:        "INSUMO",
            referenciaId:     insumoIdBig,
            cantidad:         Math.ceil(cantidadNum),
            movimientoId:     movimiento.movimientoId,
            usuarioGenerador: usuarioId,
            observaciones:    observacionAuto,
            estadoCobro:      "PENDIENTE",
        },
    });
});
```

**Diferencias clave respecto al código anterior:**
- `findFirst` → `findMany` con loop que respeta el disponible de cada lote
- `movimientoDetalles` es ahora un array → puede generar varios `MovimientoDetalle` (uno por lote consumido)
- Se eliminó el paso separado de `StockLote.update` — el decremento por lote sucede dentro del loop
- `cantidad: cantidadNum` en cargo → `cantidad: Math.ceil(cantidadNum)`

- [ ] **Step 3: Verificar que el archivo compila**

```bash
npx tsc --noEmit
```

Esperado: sin errores relacionados al archivo modificado.

- [ ] **Step 4: Prueba manual — escenario básico (un lote)**

Iniciar servidor:
```bash
npm run dev
```

En Prisma Studio (`npx prisma studio`), verificar que existe un insumo con stock en un almacén con un solo lote. Registrar valores actuales de:
- `stock.cantidad_actual`
- `stock_lote.cantidad_actual`

Ir a la UI de enfermería → abrir un paciente hospitalizado → tab Insumos → retirar 1 unidad completa de ese insumo.

Verificar en Prisma Studio:
- `stock.cantidad_actual` bajó exactamente 1.0
- `stock_lote.cantidad_actual` bajó exactamente 1.0
- `cargo_cuenta_paciente.cantidad` = 1 (Math.ceil(1) = 1 ✓)
- `movimiento_detalle.cantidad` = 1.0

- [ ] **Step 5: Prueba manual — escenario de dos lotes**

En Prisma Studio, crear o verificar que el insumo tiene dos lotes:
- Lote A (fecha vencimiento más próxima): 2 unidades
- Lote B (fecha vencimiento más lejana): 5 unidades

Retirar 3 unidades via UI.

Verificar en Prisma Studio:
- Lote A: 0 unidades (bajó de 2 a 0)
- Lote B: 4 unidades (bajó de 5 a 4)
- `stock.cantidad_actual` bajó 3 en total
- Se crearon 2 registros en `movimiento_detalle`: uno con `cantidad=2, lote_id=LoteA` y otro con `cantidad=1, lote_id=LoteB`
- `cargo_cuenta_paciente.cantidad` = 3

- [ ] **Step 6: Commit**

```bash
git add src/app/api/emergency/[id]/retiro-insumo/route.ts
git commit -m "fix(inventory): multi-lot FEFO and ceiling billing in nurse retiro

- Replace findFirst with findMany loop to correctly span multiple lots
- Fixes pre-existing bug where single-lot FEFO could produce negative lot stock
- cargo_cuenta_paciente.cantidad now uses Math.ceil for correct billing"
```

---

## Task 2: Math.ceil en cargo de reconciliar (cirugía)

**Files:**
- Modify: `src/app/api/farmacia/solicitudes/[id]/reconciliar/route.ts` (línea 63)

**Contexto:** El flujo de cirugía ya tiene FEFO multi-lote correcto en el despacho. El único cambio aquí es aplicar Math.ceil al `CargoCuentaPaciente` que se crea durante la reconciliación. Todo lo demás (cálculo de devolución a stock, movimiento ENTRADA) permanece igual.

- [ ] **Step 1: Localizar la línea exacta del cargo**

En `src/app/api/farmacia/solicitudes/[id]/reconciliar/route.ts`, buscar el bloque donde se construye `patientCargos.push(...)`, aproximadamente en línea 61–70:

```ts
if (consumedQty > 0) {
    patientCargos.push({
        citaId:           solicitud.citaId,
        emergenciaId:     solicitud.cita?.emergencia?.emergenciaId,
        tipoCargo:        'INSUMO',
        referenciaId:     originalDet.insumoId,
        cantidad:         consumedQty,          // ← ESTA línea
        usuarioGenerador: usuarioId,
        observaciones:    `Consumo Farmacia (Reconciliación) - Solicitud #${solicitudId}`,
        movimientoId:     dispatchMovement.movimientoId
    });
}
```

- [ ] **Step 2: Cambiar cantidad en el cargo**

Cambiar únicamente la línea `cantidad: consumedQty` por `cantidad: Math.ceil(consumedQty)`:

```ts
if (consumedQty > 0) {
    patientCargos.push({
        citaId:           solicitud.citaId,
        emergenciaId:     solicitud.cita?.emergencia?.emergenciaId,
        tipoCargo:        'INSUMO',
        referenciaId:     originalDet.insumoId,
        cantidad:         Math.ceil(consumedQty),   // ← cambiado
        usuarioGenerador: usuarioId,
        observaciones:    `Consumo Farmacia (Reconciliación) - Solicitud #${solicitudId}`,
        movimientoId:     dispatchMovement.movimientoId
    });
}
```

**Importante:** Las líneas de devolución a stock (`toReturn`, `stock.update`, `stockLote.update`) NO se tocan. Esas usan el decimal exacto — es correcto que sea así.

- [ ] **Step 3: Verificar que el archivo compila**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 4: Prueba manual — reconciliar con decimal**

Con el servidor corriendo, en Prisma Studio anotar el estado actual de un insumo en el flujo de cirugía (una solicitud en estado APROBADA).

En la UI de farmacia → tab "En Piso" → seleccionar una solicitud con insumos → cambiar la cantidad reconciliada a un valor decimal (ej: si se despacharon 5, ingresar 2.5).

Clic en "Reconciliar y Facturar".

Verificar en Prisma Studio:
- `solicitud_insumo.estado_solicitud` = 'DESPACHADA'
- `cargo_cuenta_paciente.cantidad` = 3 (Math.ceil(2.5) = 3 ✓)
- `movimiento_inventario` con `tipo_movimiento = 'ENTRADA'` tiene `movimiento_detalle.cantidad = 2.5` (devolución exacta ✓)
- `stock.cantidad_actual` subió 2.5 (no 3)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/farmacia/solicitudes/[id]/reconciliar/route.ts
git commit -m "fix(billing): ceiling rounding in reconciliation cargo

- consumedQty decimal is preserved for stock return calculation
- Math.ceil applied only to cargo_cuenta_paciente for correct billing"
```

---

## Task 3: Decimales en UI de enfermería — Hospitalizado (TabInsumos)

**Files:**
- Modify: `src/app/enfermeria/components/GestionPacientePanel.tsx` (función `TabInsumos`, líneas ~315–490)

**Contexto:** La función `TabInsumos` (línea 275) se activa cuando `estado !== "CIRUGIA_URGENTE"`. Hay cuatro puntos donde se bloquean o truncan los decimales.

- [ ] **Step 1: Corregir la validación en handleRetirar**

Localizar la función `handleRetirar` (línea ~315). Encontrar el bloque de validación:

```ts
const hasErrors = cart.some(c => {
    const max = c.insumo.stock.find((s: any) => s.almacenId === almacenId)?.cantidadActual ?? 0;
    const cant = parseInt(c.cantidad);
    return !cant || cant <= 0 || cant > max;
});
if (hasErrors) return;
```

Cambiar `parseInt` por `parseFloat`:

```ts
const hasErrors = cart.some(c => {
    const max = c.insumo.stock.find((s: any) => s.almacenId === almacenId)?.cantidadActual ?? 0;
    const cant = parseFloat(c.cantidad);
    return !cant || cant <= 0 || cant > max;
});
if (hasErrors) return;
```

- [ ] **Step 2: Corregir el envío al API en handleRetirar**

Dentro del mismo `handleRetirar`, localizar el `fetch` que envía el retiro:

```ts
body: JSON.stringify({ almacenId, insumoId: item.insumo.insumoId, cantidad: parseInt(item.cantidad) }),
```

Cambiar `parseInt` por `parseFloat`:

```ts
body: JSON.stringify({ almacenId, insumoId: item.insumo.insumoId, cantidad: parseFloat(item.cantidad) }),
```

- [ ] **Step 3: Corregir el input del carrito — step y regex**

Localizar el `<input>` dentro del render del carrito (dentro del `.map((item, index) =>` de la sección "Insumos a retirar"). El input actual:

```tsx
<input
    type="number" step="1"
    value={item.cantidad}
    onChange={e => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            const newCart = [...cart];
            newCart[index].cantidad = val;
            setCart(newCart);
        }
    }}
    placeholder="Cant:"
    className={...}
/>
```

Cambiar `step="1"` por `step="any"` y el regex `/^\d*$/` por `/^\d*\.?\d{0,2}$/`:

```tsx
<input
    type="number" step="any"
    value={item.cantidad}
    onChange={e => {
        const val = e.target.value;
        if (/^\d*\.?\d{0,2}$/.test(val)) {
            const newCart = [...cart];
            newCart[index].cantidad = val;
            setCart(newCart);
        }
    }}
    placeholder="Cant:"
    className={...}
/>
```

- [ ] **Step 4: Corregir la validación inline del carrito (color rojo/verde) y el botón disabled**

Dentro del mismo `.map((item, index) =>`, localizar donde se define `isInvalid`:

```ts
const cant = parseInt(item.cantidad);
const isInvalid = !item.cantidad || cant <= 0 || cant > maxStock;
```

Cambiar `parseInt` por `parseFloat`:

```ts
const cant = parseFloat(item.cantidad);
const isInvalid = !item.cantidad || cant <= 0 || cant > maxStock;
```

Luego localizar el botón "Confirmar retiros" y su prop `disabled`:

```tsx
disabled={saving || cart.length === 0 || cart.some(c => {
    const max = c.insumo.stock.find((s: any) => s.almacenId === almacenId)?.cantidadActual ?? 0;
    const val = parseInt(c.cantidad);
    return !val || val <= 0 || val > max;
})}
```

Cambiar `parseInt` por `parseFloat`:

```tsx
disabled={saving || cart.length === 0 || cart.some(c => {
    const max = c.insumo.stock.find((s: any) => s.almacenId === almacenId)?.cantidadActual ?? 0;
    const val = parseFloat(c.cantidad);
    return !val || val <= 0 || val > max;
})}
```

- [ ] **Step 5: Prueba manual — ingreso decimal en hospitalizado**

En la UI de enfermería, abrir un paciente en estado HOSPITALIZADO. En el tab Insumos:

1. Seleccionar almacén y buscar un insumo
2. Ingresar `0.5` en el campo de cantidad → debe aceptarse (antes era bloqueado por regex)
3. El input no debe mostrar borde rojo si 0.5 <= stock disponible
4. Clic en "Confirmar retiros"
5. Verificar en Prisma Studio que `cargo_cuenta_paciente.cantidad = 1` y `movimiento_detalle.cantidad = 0.5`

- [ ] **Step 6: Commit (solo Task 3 por ahora, Task 4 viene en el próximo paso)**

```bash
git add src/app/enfermeria/components/GestionPacientePanel.tsx
git commit -m "feat(nursing): allow decimal quantities in hospitalizado retiro UI"
```

---

## Task 4: Decimales en UI de enfermería — Quirófano (TabSolicitudQuirofano)

**Files:**
- Modify: `src/app/enfermeria/components/GestionPacientePanel.tsx` (función `TabSolicitudQuirofano`, líneas ~43–272)

**Contexto:** La función `TabSolicitudQuirofano` (línea 43) se activa cuando `estado === "CIRUGIA_URGENTE"`. Hay tres puntos de bloqueo: la validación antes de enviar, el API call, y el input del carrito.

- [ ] **Step 1: Corregir la validación en handleEnviar**

Localizar `handleEnviar` (línea ~79). Encontrar:

```ts
const hasErrors = cart.some(c => {
    const cant = parseInt(c.cantidad);
    return !cant || cant <= 0;
});
if (hasErrors) return;
```

Cambiar `parseInt` por `parseFloat`:

```ts
const hasErrors = cart.some(c => {
    const cant = parseFloat(c.cantidad);
    return !cant || cant <= 0;
});
if (hasErrors) return;
```

- [ ] **Step 2: Corregir el envío al API en handleEnviar**

Dentro de `handleEnviar`, localizar el `body` del fetch:

```ts
body: JSON.stringify({ 
    insumos: cart.map(item => ({ insumoId: item.insumo.insumoId, cantidad: parseInt(item.cantidad) })) 
}),
```

Cambiar `parseInt` por `parseFloat`:

```ts
body: JSON.stringify({ 
    insumos: cart.map(item => ({ insumoId: item.insumo.insumoId, cantidad: parseFloat(item.cantidad) })) 
}),
```

- [ ] **Step 3: Corregir el input del carrito — step y regex**

Localizar el `<input>` dentro del `.map((item, index) =>` del carrito de quirófano. El input actual:

```tsx
<input
    type="number" step="1"
    value={item.cantidad}
    onChange={e => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            const newCart = [...cart];
            newCart[index].cantidad = val;
            setCart(newCart);
        }
    }}
    placeholder="Cant:"
    className={...}
/>
```

Cambiar `step="1"` por `step="any"` y el regex:

```tsx
<input
    type="number" step="any"
    value={item.cantidad}
    onChange={e => {
        const val = e.target.value;
        if (/^\d*\.?\d{0,2}$/.test(val)) {
            const newCart = [...cart];
            newCart[index].cantidad = val;
            setCart(newCart);
        }
    }}
    placeholder="Cant:"
    className={...}
/>
```

- [ ] **Step 4: Corregir el botón disabled del envío**

Localizar el botón "Enviar Solicitud a Farmacia" y su prop `disabled`:

```tsx
disabled={saving || cart.length === 0 || cart.some(c => !parseInt(c.cantidad) || parseInt(c.cantidad) <= 0)}
```

Cambiar ambos `parseInt` por `parseFloat`:

```tsx
disabled={saving || cart.length === 0 || cart.some(c => !parseFloat(c.cantidad) || parseFloat(c.cantidad) <= 0)}
```

- [ ] **Step 5: Prueba manual — ingreso decimal en quirófano**

En la UI de enfermería, abrir un paciente en estado CIRUGIA_URGENTE. En el tab Insumos (muestra `TabSolicitudQuirofano`):

1. Buscar un insumo y añadirlo al carrito
2. Ingresar `2.5` en el campo de cantidad → debe aceptarse
3. Ingresar `0.5` → debe aceptarse
4. Ingresar `3.` → debe aceptarse (parseFloat lo tratará como 3)
5. El botón "Enviar Solicitud a Farmacia" debe habilitarse con valores decimales válidos
6. Enviar la solicitud → verificar en Prisma Studio que `solicitud_insumo_detalle.cantidad_solicitada = 2.5`

- [ ] **Step 6: Commit**

```bash
git add src/app/enfermeria/components/GestionPacientePanel.tsx
git commit -m "feat(nursing): allow decimal quantities in quirofano solicitud UI"
```

---

## Task 5: step="any" en reconciliación de farmacia

**Files:**
- Modify: `src/app/farmacia/components/InboxSolicitudes.tsx` (input de reconciliación, línea ~605)

**Contexto:** La lógica de reconciliación en farmacia ya usa `parseFloat` y `Math.min(insumo.cantidad, v)`. El único cambio necesario es agregar `step="any"` al `<input>` para que el teclado numérico en móvil muestre decimales y no haya validación HTML nativa que rechace el valor decimal antes de que llegue al `onChange`.

- [ ] **Step 1: Localizar el input de reconciliación**

En `src/app/farmacia/components/InboxSolicitudes.tsx`, dentro del modo `viewMode === "en-piso"`, localizar el bloque:

```tsx
<div className="flex items-center bg-white/80 border border-white/60 rounded-xl overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-lime-500/20 transition-all">
    <input 
        type="number"
        max={insumo.cantidad}
        value={reconcileQuantities[insumo.solicitudDetalleId] ?? insumo.cantidad}
        onChange={(e) => {
            const v = parseFloat(e.target.value);
            setReconcileQuantities(prev => ({ ...prev, [insumo.solicitudDetalleId]: isNaN(v) ? 0 : Math.max(0, Math.min(insumo.cantidad, v)) }));
        }}
        className="w-12 px-2 py-1.5 bg-transparent outline-none text-center font-black text-gray-800 text-xs sm:text-sm"
    />
    <div className="px-2 py-1.5 bg-gray-50 text-[9px] font-black text-gray-400 border-l border-gray-100 min-w-[35px]">
        / {insumo.cantidad}
    </div>
</div>
```

- [ ] **Step 2: Agregar step="any"**

Añadir `step="any"` al `<input>`:

```tsx
<input 
    type="number"
    step="any"
    max={insumo.cantidad}
    value={reconcileQuantities[insumo.solicitudDetalleId] ?? insumo.cantidad}
    onChange={(e) => {
        const v = parseFloat(e.target.value);
        setReconcileQuantities(prev => ({ ...prev, [insumo.solicitudDetalleId]: isNaN(v) ? 0 : Math.max(0, Math.min(insumo.cantidad, v)) }));
    }}
    className="w-12 px-2 py-1.5 bg-transparent outline-none text-center font-black text-gray-800 text-xs sm:text-sm"
/>
```

- [ ] **Step 3: Prueba manual — reconciliación decimal en farmacia**

En la UI de farmacia, ir a tab "En Piso". Seleccionar una solicitud que tenga insumos aprobados.

1. En el campo de cantidad reconciliada, ingresar `2.5` → debe aceptarse sin errores HTML de validación
2. Clic en "Reconciliar y Facturar"
3. Verificar en Prisma Studio:
   - `cargo_cuenta_paciente.cantidad = 3` (Math.ceil(2.5) — cambiado en Task 2)
   - `movimiento_inventario` de ENTRADA con `movimiento_detalle.cantidad = 2.5` (devolución exacta)

- [ ] **Step 4: Commit**

```bash
git add src/app/farmacia/components/InboxSolicitudes.tsx
git commit -m "feat(pharmacy): allow decimal quantities in reconciliation input"
```

---

## Task 6: Verificación de extremo a extremo (end-to-end)

**Contexto:** Con todos los cambios aplicados, hacer una prueba completa del flujo de cada escenario. No hay código nuevo aquí — son pasos de verificación.

- [ ] **Step 1: Verificar flujo completo hospitalizado con decimales**

Escenario: paciente hospitalizado, enfermera usa 0.5 de una ampolla.

1. Enfermería → abrir paciente HOSPITALIZADO → tab Insumos
2. Seleccionar almacén → buscar "Ampolla" (o cualquier insumo disponible)
3. Añadir al carrito, ingresar `0.5`
4. Confirmar retiro
5. Verificar en Prisma Studio:
   - `movimiento_detalle.cantidad = 0.5`
   - `stock.cantidad_actual` bajó 0.5
   - `cargo_cuenta_paciente.cantidad = 1` ← paciente paga 1 ampolla completa
6. Dar de alta al paciente (estado ALTA)
7. Verificar que la `factura` generada muestra `factura_detalle.cantidad = 1` para ese insumo

- [ ] **Step 2: Verificar flujo completo cirugía con decimales**

Escenario: cirugía, se solicitan 5 ampollas, se usan solo 3.2.

1. Enfermería → abrir paciente CIRUGIA_URGENTE → tab Insumos
2. Solicitar 5 unidades de un insumo → enviar solicitud a farmacia
3. Farmacia → tab "Nuevas" → localizar la solicitud → seleccionar almacén → "Enviar a Piso"
4. Farmacia → tab "En Piso" → localizar la solicitud → cambiar cantidad a `3.2` → "Reconciliar y Facturar"
5. Verificar en Prisma Studio:
   - `cargo_cuenta_paciente.cantidad = 4` (Math.ceil(3.2) = 4 ✓)
   - Movimiento ENTRADA con `movimiento_detalle.cantidad = 1.8` (5 - 3.2 = 1.8 devuelto ✓)
   - `stock.cantidad_actual` del insumo subió 1.8
6. Dar de alta al paciente → verificar `factura_detalle.cantidad = 4`

- [ ] **Step 3: Verificar escenario FEFO multi-lote en hospitalizado**

En Prisma Studio, verificar o crear un insumo con dos lotes activos en el mismo almacén:
- Lote A con fecha de vencimiento anterior, `cantidad_actual = 2`
- Lote B con fecha de vencimiento posterior, `cantidad_actual = 5`

Desde enfermería (HOSPITALIZADO), retirar `3.5` unidades de ese insumo.

Verificar en Prisma Studio:
- Lote A: `cantidad_actual = 0` (se agotó completamente)
- Lote B: `cantidad_actual = 3.5` (bajó de 5 a 3.5)
- Se crearon dos registros en `movimiento_detalle` para el mismo `movimiento_id`: uno con `cantidad=2, lote_id=LoteA` y otro con `cantidad=1.5, lote_id=LoteB`
- `cargo_cuenta_paciente.cantidad = 4` (Math.ceil(3.5) = 4)

- [ ] **Step 4: Commit final de verificación**

```bash
git commit --allow-empty -m "test: verified decimal supply tracking end-to-end

- hospitalizado: 0.5 used → stock -0.5, billed 1
- cirugia: 3.2 of 5 used → stock +1.8 returned, billed 4
- multi-lot FEFO: 3.5 across 2 lots correctly split"
```

---

## Resumen de cambios

| Tarea | Archivo | Líneas aprox. | Complejidad |
|---|---|---|---|
| 1 | `retiro-insumo/route.ts` | ~60 líneas reemplazadas | Media |
| 2 | `reconciliar/route.ts` | 1 línea | Mínima |
| 3 | `GestionPacientePanel.tsx` (TabInsumos) | 5 cambios puntuales | Baja |
| 4 | `GestionPacientePanel.tsx` (TabSolicitudQuirofano) | 4 cambios puntuales | Baja |
| 5 | `InboxSolicitudes.tsx` | 1 atributo | Mínima |
| 6 | — | Verificación manual | — |

**Sin cambios en:** schema de Prisma, migraciones de DB, otras rutas de API, módulos de caja, laboratorio, imagenología.
