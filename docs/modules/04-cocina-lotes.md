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

## 3. Asistente de Horneo por Lote / Molde Completo & Excedentes a Vitrina

En talleres de repostería artesanal, hornear porciones fraccionadas es ineficiente; por lo tanto, la dueña suele preparar el **molde completo**:

1. **Agrupación Consolidada por Receta**:
   El sistema agrupa automáticamente los requerimientos de la misma receta a través de múltiples encargos, incluso si formaban parte de pedidos multilínea con otros postres.
2. **Modo Molde Completo vs Exacto**:
   - `Molde Completo`: Hornea en múltiplos de `porciones_base` (ej. 1 molde de 16 brownies).
   - `Exacto Encargos`: Hornea únicamente las unidades requeridas.
3. **Gestión Automática de Excedentes a Vitrina (`stock_anaquel`)**:
   Si los encargos suman 10 brownies y se hornea 1 molde de 16 unidades:
   - Las 10 unidades cubren los pedidos y pasan a `En Preparación`.
   - Las 6 unidades sobrantes se suman de forma automática a `receta.stock_anaquel` (Vitrina).
   - El catálogo del cliente detecta inmediatamente el nuevo stock disponible para despacho en el mismo día sin tener que hornear nuevamente.

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
