# 📦 Módulo 1: Bodega, Insumos & Empaques

## 1. Propósito del Módulo
Permite al taller gastronómico registrar y controlar todos los ingredientes comestibles (*Materia Prima*) y materiales de presentación (*Empaques*, cajas, blondas, cintas). Establece la base de costos unitarios que alimenta el motor de costeo de recetas.

---

## 2. Modelo de Datos (`Insumo`)

```typescript
export type TipoInsumo = 'materia_prima' | 'empaque';
export type UnidadInsumo = 'g' | 'kg' | 'ml' | 'l' | 'und';

export interface Insumo {
  id: string;
  nombre: string;
  tipo?: TipoInsumo;
  unidad: UnidadInsumo;
  stock_actual: number;
  stock_min: number;
  costo_empaque: number;
  gramos_por_empaque: number;
  historial_precios?: { fecha: string; costo: number }[];
}
```

---

## 3. Lógica de Costeo Unitario

Para calcular el costo unitario de cualquier insumo:

$$\text{Costo por Unidad Base} = \frac{\text{costo\_empaque}}{\text{gramos\_por\_empaque}}$$

* **Ejemplo 1 (Gramos)**: Mantequilla sin sal 82% comprada en bloque de 500g a $18.000 COP.  
  $\text{Costo por gramo} = \frac{18000}{500} = \$36 \text{ COP/g}$.
* **Ejemplo 2 (Unidades)**: Cajas para torta 25x25 compradas en paquete de 10 und a $45.000 COP.  
  $\text{Costo por caja} = \frac{45000}{10} = \$4.500 \text{ COP/und}$.

---

## 4. Alertas y Estados Visuales de Stock

* 🔴 **Agotado**: `stock_actual <= 0`
* 🟡 **Stock Bajo / Crítico**: `stock_actual <= stock_min`
* 🟢 **Óptimo**: `stock_actual > stock_min`

---

## 5. Acciones del Operario

1. **Nuevo Insumo**: Formulario modal para ingresar insumos con validación de valores positivos.
2. **Registro Rápido de Compra (`+ Compra`)**: Permite sumar stock cuando se regresa del supermercado y opcionalmente actualizar el costo si el proveedor subió el precio.
3. **Registro Rápido de Merma (`- Merma`)**: Descuenta stock inmediatamente ante desperdicios, caídas o productos vencidos y lo transfiere a la bitácora de mermas financieras.
