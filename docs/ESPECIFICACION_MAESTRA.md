# 🥐 ESPECIFICACIÓN MAESTRA DE REQUISITOS - GASTROFLOW ARTISAN

Este documento contiene la totalidad de las reglas de negocio, flujos operativos, decisiones de diseño y restricciones acordadas para el desarrollo del sistema GastroFlow Artisan (pastelería y repostería artesanal en Colombia).

---

## 🎯 1. PERFIL DE USUARIO Y LENGUAJE
* **Usuario final:** Una repostera/pastelera artesanal independiente.
* **Tono del sistema:** Lenguaje natural de taller, práctico, directo y cálido. 
* **Regla de oro:** CERO jerga técnica de finanzas (prohibido usar términos como "costo duro", "ventas comprometidas" o "remanente neto" en las pantallas principales).
* **Moneda:** Pesos Colombianos (`COP $`), redondeado a números enteros sin centavos (ej: `$ 85.000 COP`).

---

## 🧭 2. NAVEGACIÓN Y ESTRUCTURA (6 MÓDULOS SAGRADOS)
Los nombres del menú de navegación superior deben ser EXACTAMENTE estos 6:
1. 📊 **Dashboard**
2. 📋 **Libreta de Encargos**
3. 👨‍🍳 **Preparación y Cocina**
4. 📦 **Bodega de Insumos**
5. 📖 **Recetario y Costeo**
6. 📑 **Auditoría e Historial**

---

## 📋 3. ESPECIFICACIÓN DETALLADA DE CADA MÓDULO

### MÓDULO 1: DASHBOARD
* **4 Tarjetas KPI obligatorias (Lenguaje natural):**
  1. `Total Encargos`: Suma total en COP y conteo de pedidos activos en agenda.
  2. `Saldo por Cobrar`: Dinero en la calle pendiente por recaudar al momento de la entrega.
  3. `Valor de Bodega`: Dinero total invertido en materias primas físicamente guardadas en estante.
  4. `Pérdidas por Merma`: Dinero acumulado perdido por ingredientes dañados, vencidos o accidentes.
* **Gráfica de Rentabilidad:**
  * **Regla estricta de CSS:** El contenedor debe tener una **altura fija de 280px** (`h-[280px] w-full relative`) con `maintainAspectRatio: false` para que **NUNCA se estire verticalmente** cuando aumente el número de pedidos.
  * **Contenido visual:** Dos barras sencillas por producto estrella:
    - 🟠 Barra Ámbar: `Costo de Producción` (insumos + luz/gas).
    - 🟢 Barra Verde: `Ganancia Limpia` (Precio de venta menos costo de producción).
* **Agenda de Entregas Hoy:**
  * Lista de pedidos del día con hora, cliente, producto, abono y saldo pendiente.
  * Contenedor con scroll vertical independiente (`max-h-[360px] overflow-y-auto`).

---

### MÓDULO 2: LIBRETA DE ENCARGOS
* **Vista Activa Despejada:** Por defecto solo se listan pedidos operativos (`pendiente` y `en_preparacion`). Pestañas de filtro rápido: `[🔥 Activos]`, `[✅ Entregados]`, `[❌ Cancelados]`, `[Todos]`.
* **Cancelación de Encargos:** Al presionar "Cancelar", el encargo **desaparece de inmediato de la vista activa diaria**, pero **no se borra de la base de datos**: queda archivado en Historial con su etiqueta roja `Cancelado`.
* **Modal Editor de WhatsApp:** Plantilla personalizable antes del envío con saludo, confirmación de encargo, fecha/hora, abono recibido y saldo pendiente en COP, con enlace directo a `https://wa.me/...`.
* **Modal Pase a Cocina (Candado de Seguridad Estricto):**
  * Compara los insumos de la receta $\times$ cantidad contra las existencias reales en Bodega.
  * Si falta aunque sea 1 gramo (`hayFaltantes === true`):
    - El botón `[Confirmar y Descontar]` DEBE estar **100% deshabilitado (`disabled`)**, en gris y con cursor bloqueado.
    - Alerta roja visible: *"⛔ Preparación Bloqueada: Materia Prima Insuficiente. Registra la compra en Bodega antes de continuar"*.
    - Muestra qué insumo falta y cuánto, con botón directo `[+ Comprar]`.
    - **CERO descuentos en falso. La bodega JAMÁS debe quedar en cero artificialmente.**

---

### MÓDULO 3: PREPARACIÓN Y COCINA (VISTA DUAL OBLIGATORIA)
Toggle superior entre dos modos de trabajo complementarios:
1. **Modo "Mesa de Trabajo" (Individual por Encargo):**
   * Pensado para el pesaje en el mesón físico con la balanza.
   * Selecciona un encargo de la lista $\rightarrow$ muestra la receta escalada para esa tanda.
   * Lista de ingredientes con gramos exactos y **checkboxes interactivos `[✓]`** para tachar lo que se echa al bowl.
   * Detalle de equipos eléctricos (Watts y minutos de batidora/horno).
   * Notas personalizadas del cliente (dedicatorias, alergias, empaque especial).
2. **Modo "Abastecimiento Global" (Consolidado de Compras):**
   * Pensado para compras en supermercado o distribuidora.
   * Consolida la demanda total de todos los pedidos pendientes.
   * **Matemáticas de empaque comercial:** Si necesita 1.300 g y el paquete comercial viene de 1.000 g, calcula comprar 2 paquetes (2.000 g).
   * Calcula el **sobrante proyectado** que quedará en bodega tras hornear (700 g).
   * Calcula el presupuesto total en COP y ofrece botón `[📋 Copiar Lista WhatsApp]`.

---

### MÓDULO 4: BODEGA DE INSUMOS
* **Formato:** Tabla horizontal de **FILAS COMPACTAS** (prohibido usar tarjetas o cuadritos que ocupan demasiado espacio y dificultan escanear un inventario largo).
* **Campos por fila:** Insumo, Stock Actual + Unidad, Reserva Mínima, Presentación Comercial (g por empaque = $ costo empaque), Costo Unitario por g/und, Estado (Agotado, Stock Bajo, Óptimo) y Acciones Rápidas.
* **Acciones Rápidas por fila:**
  - `[+ Compra]`: Suma paquetes comprados y actualiza stock y costo.
  - `[- Merma]`: Registra pérdida con motivo (vencimiento, accidente, defecto) y descuenta de stock calculando su costo en COP.
  - `[✏️ Editar]`: Modal completo de edición del insumo.
* **Selector de Orden por Prioridad:**
  - `🚨 Prioridad Crítica (Agotados y Bajos primero)` [Predeterminado].
  - `📦 Mayor Stock primero`.
  - `🔤 Alfabético (A - Z)`.
  - `🔤 Alfabético (Z - A)`.
* **Buscador:** Campo de texto directo por nombre. *(Prohibido agregar botones de clústeres o categorías como "lácteos" o "secos")*.

---

### MÓDULO 5: RECETARIO Y COSTEO
* **Formato Acordeón Colapsable:** Cada receta se presenta en una barra resumen compacta (Nombre, porciones, tiempo, precio de venta, valor hora y escala). Al hacer clic se expande la ficha técnica completa; al hacer clic de nuevo se minimiza.
* **Multiplicador de Escala Live:** Botones `[x1]`, `[x1.5]`, `[x2]`, `[x3]` que recalculan ingredientes y costos en tiempo real.
* **Costeo Inverso (La realidad de la pastelera):**
  - El precio de venta que ella ya cobra en el mercado es el punto de partida.
  - Costos directos e indirectos: Insumos + Electricidad (Watts $\times$ minutos $\times$ tarifa kWh fija) + CIF (% editable).
  - Remanente limpio = Precio de venta - Costos directos.
  - **Pago Real por Hora:** Remanente limpio dividido entre las horas de trabajo.
  - Se muestra en la ficha: *"⏱️ Pago por tu hora: $ 25.000 COP / h (Ganancia limpia de $ 50.000 COP tras 2h de trabajo)"*.
* **Simulador de Meta Horaria Plegado:**
  - Oculto tras el botón `[💡 Simular Meta Horaria]` para no estorbar la vista.
  - Permite ingresar una meta deseada por hora (ej. $ 30.000 COP/h) y calcula a cuánto debería vender el producto, con botón opcional `[Actualizar Precio de Venta a este Valor]`.

---

### MÓDULO 6: AUDITORÍA E HISTORIAL
* **Fidelidad de Clientes (LTV - Lifetime Value):**
  - Agrupa las compras por persona (Nombre y Teléfono).
  - Métrica reina: **Total Comprado Acumulado en COP** a lo largo del tiempo.
  - Total de pedidos realizados (desglose de entregados, en curso y cancelados).
  - Ticket promedio y fecha de última compra.
  - Botón para desplegar el historial completo con todos los productos que ese cliente ha pedido.
* **Archivo de Encargos Pasados:** Registro histórico de todos los pedidos (completados y cancelados).
* **Historial de Mermas:** Registro de pérdidas con fecha, insumo, cantidad, causa y costo en COP.

---

### CENTRO DE ALERTAS (CAMPANA DE NOTIFICACIONES)
Distingue claramente dos niveles de urgencia:
1. 🚨 **Faltantes para Encargos Pendientes (Prioridad Máxima):** Insumos requeridos por pedidos vivos que superan el stock de bodega (`demanda pendientes - stock actual`), indicando qué clientes están esperando y botón directo `[+ Comprar en Bodega]`.
2. ⚠️ **Reserva de Seguridad Baja:** Insumos que cayeron por debajo de su stock mínimo de bodega como recordatorio preventivo.

---

### SEGURIDAD Y RESPALDO
* Configuración de Tarifa Eléctrica en Colombia ($/kWh, promedio $ 850 COP).
* Botones de **Descargar Copia (Exportar JSON)** y **Restaurar Copia (Importar JSON)** para que jamás se pierda la información.
* LocalStorage blindado con `try/catch` y fallback para evitar pantallas en blanco.

