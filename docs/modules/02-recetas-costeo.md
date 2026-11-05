# 🧾 Módulo 2: Recetario & Costeo Real (Escandallos Financieros)

## 1. Propósito del Módulo
Permite diseñar las fórmulas de preparación culinaria y calcular el costo real de producción, integrando materia prima, empaque, consumo eléctrico de maquinaria, costos indirectos de fabricación (CIF) y el **Sueldo Real por Hora** que percibe la repostera o chef.

---

## 2. Modelo de Datos (`Receta`)

```typescript
export interface IngredienteReceta {
  insumo_id: string;
  cantidad: number;
}

export interface EquipoReceta {
  nombre: string;
  potencia_watts: number;
  minutos_uso: number;
}

export interface Receta {
  id: string;
  nombre: string;
  porciones_base: number;
  precio_venta: number;
  tiempo_minutos: number;
  cif_porcentaje: number;
  ingredientes: IngredienteReceta[];
  equipos: EquipoReceta[];
}
```

---

## 3. Fórmulas del Escandallo Financiero

### A. Costo Directo de Ingredientes
$$\text{Costo Ingredientes} = \sum_{i} \left( \text{cantidad}_i \times \text{costo\_unitario}(insumo_i) \right)$$

### B. Costo Eléctrico de Equipos
$$\text{Consumo kWh} = \sum_{e} \left( \frac{\text{potencia\_watts}_e \times \text{minutos\_uso}_e}{60 \times 1000} \right)$$
$$\text{Costo Equipos} = \text{Consumo kWh} \times \text{tarifa\_kwh}$$

### C. Costos Indirectos de Fabricación (CIF)
$$\text{Costo CIF} = \text{Costo Ingredientes} \times \left( \frac{\text{cif\_porcentaje}}{100} \right)$$

### D. Costo Directo Total de la Tanda
$$\text{Costo Directo Total} = \text{Costo Ingredientes} + \text{Costo Equipos} + \text{Costo CIF}$$

### E. Sueldo Real por Hora
$$\text{Margen Bruto} = \text{precio\_venta} - \text{Costo Directo Total}$$
$$\text{Horas Invertidas} = \frac{\text{tiempo\_minutos}}{60}$$
$$\text{Sueldo Real por Hora} = \frac{\text{Margen Bruto}}{\text{Horas Invertidas}}$$

---

## 4. El Simulador "¿Qué pasaría si...?"
Permite proyectar el precio de venta recomendado si se desea fijar una meta salarial por hora y un margen de reinversión para el negocio:

$$\text{Precio Sugerido} = \frac{\text{Costo Directo Total} + (\text{Meta Salario/Hora} \times \text{Horas Invertidas})}{1 - \frac{\text{Margen Deseado \%}}{100}}$$
