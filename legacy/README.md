# GastroFlow Legacy Prototypes Archive

Esta carpeta preserva la evolución histórica de **GastroFlow** antes de su migración a la arquitectura moderna modular basada en **Vite + React + TypeScript + Tailwind CSS**.

## Registro de Versiones Históricas

| Archivo | Versión | Hitos y Cambios Principales |
|---|---|---|
| `Gastroflow.html` | v1.0 | Prototipo inicial en un solo archivo con React CDN y cálculo básico de insumos y costos. |
| `Gastroflow2.html` | v2.0 | Incorporación del enfoque de taller gastronómico, primeros encargos y costeo de mano de obra. |
| `Gastroflow3.html` | v3.0 | Formateo oficial a moneda colombiana (COP) y cálculo de tarifas eléctricas (kWh). |
| `Gastroflow4.html` | v4.0 | Libreta de pedidos completa con estados de producción y saldo pendiente. |
| `Gastroflow5.html` | v5.0 | Refinamiento de la interfaz de usuario, alertas visuales y persistencia localStorage. |
| `Gastroflow6.0.html` | v6.0 | Adición de Dashboard financiero con métricas COGS, ganancia neta, auditoría y gráficos con Chart.js. |
| `Gastroflow6.1.html` | v6.1 | Versión final del monolito con selector de WhatsApp, validación de stock y depuración de cálculo por hora. |
| `Instrucciones 2.docx` | Manual | Manual de usuario redactado para la dueña del negocio y operarios de cocina. |

> [!NOTE]
> Estos archivos se mantienen como referencia arqueológica y validación de compatibilidad de datos hacia atrás (migración del esquema de `localStorage`). El desarrollo activo se realiza exclusivamente sobre la estructura moderna en `src/`.
