# 📚 Centro de Documentación Oficial de GastroFlow

Bienvenido a la documentación técnica, arquitectónica y operativa de **GastroFlow Artisan**. Este repositorio centraliza el conocimiento del sistema para desarrolladores humanos, colaboradores y agentes de IA.

---

## 🗺️ Mapa de la Documentación

### 1. [Arquitectura del Sistema](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/architecture/ARCHITECTURE.md)
* Principios de diseño (Clean / Feature-Driven Architecture).
* Stack tecnológico: Vite, React, TypeScript, Tailwind CSS, Vitest, Playwright.
* Flujo de datos unidireccional y persistencia offline con `localStorage`.
* [ADR-001: Selección de Vite + React + TS + Tailwind](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/architecture/ADR-001-modern-stack.md).

### 2. Especificación de Módulos de Negocio
* [Módulo 1: Bodega, Insumos & Empaques](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/modules/01-bodega-insumos.md): Materias primas, empaques, conversión de unidades, alertas de stock mínimo, historial de compras y variación de precios.
* [Módulo 2: Recetas & Costeo Real (Escandallos)](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/modules/02-recetas-costeo.md): Costeo directo por porción, consumo eléctrico de equipos, CIF indirecto, cálculo de salario real por hora y simulador de precio.
* [Módulo 3: Libreta de Pedidos & Agenda](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/modules/03-pedidos-agenda.md): Flujo de estados (`Pendiente` -> `En Preparación` -> `Terminado` -> `Entregado`), anticipos y saldos por cobrar, generador de mensajes de WhatsApp.
* [Módulo 4: Cocina, Validación de Lotes & Mermas](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/modules/04-cocina-lotes.md): Validador inteligente de stock previo a la cocción, pase a cocina con descuento automático de inventario, registro de mermas con costo económico.
* [Módulo 5: Dashboard Financiero & Auditoría](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/modules/05-dashboard-auditoria.md): Facturación bruta, costo de insumos (COGS), pérdidas por mermas, ganancia limpia, producto estrella por hora y bitácora de auditoría.

### 3. [Protocolo de Pruebas & Calidad](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/testing/TESTING_PROTOCOL.md)
* Guía de pruebas unitarias matemáticas con Vitest.
* Guía de pruebas End-to-End en navegador real con Playwright.
* Verificación de la Puerta de Calidad obligatoria.

### 4. [Flujo Git, Ramas y Merges](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/workflow/GIT_WORKFLOW.md)
* Estructura de ramas: `feat/`, `fix/`, `test/`, `refactor/`, `docs/`.
* Política inquebrantable de merge a `main`: **"Si no se hacen pruebas en navegador, no puede mergearse a main."**
* Formato de Conventional Commits.
