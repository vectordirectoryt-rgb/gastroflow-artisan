---
name: gastroflow-architecture
description: Architectural guidelines, domain models, mathematical formulas (escandallo, CIF, real hourly salary, COP currency formatting) and offline storage patterns for GastroFlow.
---

# GastroFlow Architecture & Domain Modeling Guide

Use this skill whenever you are designing, modifying, or auditing domain models, formulas, or component architecture in GastroFlow.

## Tech Stack
- **Framework**: Vite + React 18 / 19 + TypeScript
- **Styling**: Tailwind CSS (custom brand amber palette: `brand-50` to `brand-950`)
- **Icons**: Lucide React
- **Unit Testing**: Vitest + React Testing Library + JSDOM
- **E2E Testing**: Playwright (Desktop Chromium)
- **Persistence**: Offline-first via typed `localStorage` adapter (`src/core/storage/`)

## Financial & Culinary Domain Formulas

### 1. Cost of Raw Material (`Costo Insumo`)
$$\text{Costo Unitario (g/ml/und)} = \frac{\text{costo\_empaque}}{\text{gramos\_por\_empaque}}$$
$$\text{Costo Ingrediente en Receta} = \text{cantidad} \times \text{Costo Unitario}$$

### 2. Energy / Equipment Cost (`Costo Equipos`)
$$\text{Consumo kWh} = \frac{\text{potencia\_watts} \times \text{minutos\_uso}}{60 \times 1000}$$
$$\text{Costo Electricidad} = \text{Consumo kWh} \times \text{tarifa\_kwh}$$

### 3. CIF (Costos Indirectos de Fabricación)
$$\text{Costo CIF} = \text{Costo Ingredientes Directos} \times \left(\frac{\text{cif\_porcentaje}}{100}\right)$$

### 4. Direct Cost of Recipe Batch (`Costo Directo Total`)
$$\text{Costo Directo} = \text{Costo Ingredientes} + \text{Costo Equipos} + \text{Costo CIF}$$

### 5. Real Hourly Salary (`Ganancia Real por Hora`)
$$\text{Margen Bruto Receta} = \text{precio\_venta} - \text{Costo Directo}$$
$$\text{Horas Invertidas} = \frac{\text{tiempo\_minutos}}{60}$$
$$\text{Sueldo Real por Hora} = \frac{\text{Margen Bruto Receta}}{\text{Horas Invertidas}}$$

### 6. Currency Formatter (Colombian Peso COP)
Must always format as:
`$ 85.000` (rounded integer, dot as thousand separator, no decimals, prefix `$ `).
Utility in `src/core/utils/formatters.ts`: `formatCOP(amount: number): string`.

## Directory Standard
- `src/core/`: Immutable domain logic, storage interfaces, formatters, and seed data.
- `src/features/bodega/`: Raw materials, packaging, inventory balances, restock purchases.
- `src/features/recetario/`: Recipes, financial escandallos, equipment wattages, simulator.
- `src/features/pedidos/`: Order book, WhatsApp message formatting, payments, status cycle.
- `src/features/cocina/`: Stock availability check prior to production, batch confirmation and deduction.
- `src/features/dashboard/`: Net profit, COGS, waste losses, rankings, daily agenda.
- `src/features/historial/`: Audit log for completed orders, recorded waste, supplier price changes.
