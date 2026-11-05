# 📅 Módulo 3: Libreta de Pedidos & Agenda Diaria

## 1. Propósito del Módulo
Administra la libreta de encargos de clientes con seguimiento de fechas límite de entrega, cronograma de horneo anticipado, control de cobros (anticipo del 50% y saldos pendientes) e integración con mensajes rápidos de WhatsApp.

---

## 2. Modelo de Datos (`Pedido`)

```typescript
export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'terminado' | 'entregado';

export interface Pedido {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  receta_id: string;
  cantidad: number;
  fecha_entrega: string; // ISO YYYY-MM-DD
  hora_entrega: string;  // HH:MM
  notas: string;
  precio_total: number;
  abono: number;
  saldo_pendiente: number;
  estado: EstadoPedido;
  created_at: string;
}
```

---

## 3. Ciclo de Vida del Pedido

```mermaid
stateDiagram-v2
    [*] --> Pendiente: Cliente encarga y paga anticipo (ej. 50%)
    Pendiente --> En_Preparacion: Cocina inicia producción
    En_Preparacion --> Terminado: Producto empacado y listo para retiro
    Terminado --> Entregado: Cliente retira y cancela 100% del saldo
    Entregado --> [*]
```

### Reglas de Negocio en la Entrega
- Cuando el pedido pasa al estado `entregado` y está completamente pagado (`saldo_pendiente === 0`), se contabiliza formalmente en las métricas del **Dashboard Financiero** (Facturación Bruta e Ingresos Netos).
- En caso de existir saldo pendiente al momento de la entrega, la aplicación alerta visualmente en color rojo con el botón de acción rápida `Cobrar Resto`.

---

## 4. Asistente y Agenda del Día
- Filtra automáticamente los pedidos programados para la fecha actual (`hoy`).
- Los organiza por hora de entrega prometida.
- La campana de notificaciones `🔔` alerta sobre entregas para **HOY** y para **MAÑANA** (para hornear con anticipación).
