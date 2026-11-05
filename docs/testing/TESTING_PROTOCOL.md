# 🧪 Protocolo de Testing y Calidad: GastroFlow

> **REGLA DE CALIDAD NO NEGOCIABLE**:
> **«Si no se hacen pruebas en navegador, no puede mergearse a main.»**

Este documento detalla la estructura, las herramientas y los comandos para ejecutar las pruebas en GastroFlow.

---

## 1. Niveles de Prueba

| Nivel | Herramienta | Objetivo | Ubicación |
|---|---|---|---|
| **Unitarias** | **Vitest** | Validar motores matemáticos de escandallo, fórmulas COP, conversiones de unidades y reducción de inventario. | `tests/unit/` o `src/**/*.test.ts` |
| **Componentes** | **React Testing Library** | Validar renderizado de formularios modales, botones de acción y badges de estado. | `tests/unit/components/` |
| **End-to-End (E2E)** | **Playwright** | Validar navegación real en navegador Chromium: crear insumos, costear recetas, simular tandas, cobrar pedidos y exportar JSON. | `tests/e2e/` |

---

## 2. Comandos de Ejecución

### Pruebas Unitarias
```bash
# Ejecutar todas las pruebas unitarias una vez
npm run test:unit

# Modo observador interactivo (watch)
npm run test:unit:watch

# Cobertura de código
npm run test:coverage
```

### Pruebas en Navegador Real (Playwright)
```bash
# Ejecutar suite E2E en modo headless (navegador en segundo plano)
npm run test:e2e

# Ejecutar con navegador visible (headed) para inspeccionar la pantalla
npm run test:e2e:headed

# Abrir UI interactiva de Playwright con Time-Travel y Debugger
npm run test:e2e:ui
```

---

## 3. Escenarios Críticos Obligatorios para Pruebas E2E en Navegador

Toda nueva rama que toque flujos de usuario debe verificar:
1. **Flujo de Insumos**: Creación de un insumo nuevo, verificación de cálculo de costo unitario por gramo y actualización rápida mediante `+ Compra`.
2. **Flujo de Recetario**: Creación de receta, suma de ingredientes y equipos, verificación del Sueldo Real por Hora en el cuadro financiero.
3. **Flujo de Cocina**: Selección de receta y cantidad de lotes, verificación visual del validador de despensa (verde si hay stock, rojo si falta) y confirmación de descuento de stock.
4. **Flujo de Pedidos**: Creación de encargo con cliente y fecha, abono del 50%, cambio de estado a `Terminado` y ejecución de `Cobrar Resto` para marcar 100% pagado.
5. **Flujo de Persistencia**: Recarga de página (`page.reload()`) y comprobación de que los datos siguen intactos en `localStorage`.
