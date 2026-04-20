---
name: prevent-scroll-bleed
description: Standard pattern to prevent background scrolling (scroll bleed/chaining) when Modals are open in React.
---

# Prevenir Scroll Bleed (Fondo se mueve)

El "scroll bleed" o "scroll chaining" ocurre cuando un usuario llega al final del scroll de un Modal, y el navegador comienza a hacer scroll automáticamente en la página principal que está de fondo.

## Instrucción Principal

Cada vez que diseñes, implementes o repares un **Modal**, un **Sidebar** en sobreposición o cualquier componente tipo "overlay" en este proyecto, y el usuario reporte problemas de scroll de fondo, **debes aplicar esta solución inmediatamente**.

### La Solución Efectiva (`useEffect`)

La forma más directa y estándar en React (Next.js client components) es agregar la propiedad `overflow: hidden` al elemento principal body del DOM y removerla al cerrar o desmontar el modal.

Añade u actualiza el siguiente Hook dentro del componente:

```tsx
import { useEffect } from "react";

// 'isOpen' puede llamarse 'show' o 'open' dependiendo de los props.
export function TuModal({ isOpen, onClose }) {

    useEffect(() => {
        if (isOpen) {
            // Bloquea el scroll del fondo
            document.body.style.overflow = 'hidden';
            
            // ... (otra lógica al abrir, si existiera)
        } else {
            // Libera el scroll si el modal se cierra
            document.body.style.overflow = '';
        }
        
        // Cleanup function (Importantísimo si el componente se desmonta inesperadamente)
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // ...
}
```

### Reglas de Uso de esta Skill
1. Asegúrate siempre de restaurar el overflow con un string vacío `''` o `'unset'`, **no lo dejes ausente en el cleanup**, de lo contrario la app puede quedarse congelada si el usuario force-sale de la ruta.
2. Utiliza esta skill siempre que el usuario te diga variaciones de: "El fondo se mueve al hacer scroll en un modal", "El panel principal hace scroll cuando estoy en un modal pequeño", "El modal mueve toda la pantalla".
