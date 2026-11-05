# ⚡ Módulo 4: Control de Cocina, Validación de Lotes & Mermas

## 1. Propósito del Módulo
Evita detener la producción culinaria a mitad de una receta por falta de insumos. Proporciona un validador en tiempo real que revisa la despensa antes de encender el horno, descuenta los inventarios automáticamente tras confirmar la tanda y registra cualquier merma o desperdicio con su impacto financiero en pesos.

---

## 2. Validador de Disponibilidad de Despensa

Antes de preparar una tanda de $N$ lotes o porciones de una receta:

1. El sistema calcula para cada ingrediente $i$:
   $$\text{Cantidad Requerida}_i = \text{cantidad\_base}_i \times \text{factor\_escala}$$
2. Compara contra `stock_actual` del insumo:
   - Si $\text{stock\_actual}_i \ge \text{Cantidad Requerida}_i \implies$ **Disponible** (Verde).
   - Si $\text{stock\_actual}_i < \text{Cantidad Requerida}_i \implies$ **Faltante** (Rojo con alerta explícita: *"Faltan X g de Y"*).
3. **Bloqueo Inteligente**:
   Si algún insumo está en estado Faltante, el botón `Confirmar y Descontar Insumos` alerta al usuario del déficit para evitar descuadres en cocina.

---

## 3. Registro de Mermas y Desperdicios

```typescript
export interface Merma {
  id: string;
  insumo_id: string;
  insumo_nombre: string;
  cantidad: number;
  unidad: string;
  costo_perdido: number;
  motivo: string; // 'quemado', 'vencido', 'caida', 'prueba', 'otro'
  fecha: string;
}
```

Cada merma registrada:
1. Resta inmediatamente del `stock_actual` del insumo.
2. Calcula $\text{Costo Perdido} = \text{cantidad} \times \text{costo\_unitario}$.
3. Se adiciona a la lista histórica de mermas e impacta directamente el estado de resultados en el **Dashboard Financiero** restando a la Ganancia Real Neta.
