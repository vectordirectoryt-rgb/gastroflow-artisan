# 🧁 GastroFlow Artisan

> **Sistema de Gestión Integral para Talleres Gastronómicos, Costeo Real, Inventario y Encargos.**

[![CI Quality Gate](https://github.com/user/gastroflow/actions/workflows/ci.yml/badge.svg)](https://github.com/user/gastroflow/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit%20Tests-729B1B.svg)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Browser-45ba4b.svg)](https://playwright.dev/)

---

## 📖 Acerca del Proyecto

**GastroFlow Artisan** está diseñado específicamente para la realidad de cocinas, pastelerías y reposterías artesanales. Elimina la incertidumbre financiera calculando al centavo:
* **Costeo Directo por Receta**: Materia prima por gramo/unidad, costos de empaque y presentación.
* **Consumo Energético (kWh)**: Minutos de horno eléctrico y batidoras industriales convertidos a pesos colombianos (COP).
* **Costos Indirectos de Fabricación (CIF)**: Porcentaje configurable para depreciación, servicios e imprevistos.
* **★ El Dato Estrella: Sueldo Real por Hora**: Descubre cuánto ganas verdaderamente por cada 60 minutos de trabajo batiendo, horneando y decorando.
* **Libreta de Encargos & Agenda**: Fechas de entrega prometidas, recordatorios de horneo previo, cobro de anticipos (50%) y saldos restantes.
* **Validador de Cocina**: Monitoreo de despensa antes de hornear y descuento automático de existencias.
* **Offline-First**: Funciona sin conexión a internet y guarda automáticamente el estado en `localStorage` con respaldo JSON.

---

## 🚀 Inicio Rápido

### Requisitos Previos
* **Node.js** 20.x o superior
* **npm** 10.x o superior
* **Git** 2.40+

### Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd GastroFlow

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```
La aplicación abrirá en `http://localhost:3000`.

---

## 🚦 Protocolo de Calidad & Testing

> [!IMPORTANT]
> Todo desarrollo sigue el estándar obligatorio especificado en [**`AGENTS.md`**](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/AGENTS.md).  
> **«Si no se hacen pruebas en navegador, no puede mergearse a main.»**

| Comando | Tipo de Prueba | Herramienta |
|---|---|---|
| `npm run test:unit` | Pruebas Unitarias de Matemáticas y Estado | **Vitest** |
| `npm run test:e2e` | Pruebas End-to-End en Navegador Real (Headless) | **Playwright** |
| `npm run test:e2e:headed` | Pruebas E2E con Navegador Chromium Visible | **Playwright** |
| `npm run lint` | Verificación Estricta de Tipos sin Emisión | **TypeScript (tsc)** |
| `npm run build` | Compilación para Producción | **Vite** |

---

## 📂 Arquitectura Modular

```
GastroFlow/
├── AGENTS.md                      # Protocolo oficial y reglas de desarrollo
├── docs/                          # Centro de documentación técnica y módulos
│   ├── README.md                  # Índice de especificaciones
│   ├── architecture/              # Diagramas y ADRs
│   ├── modules/                   # Especificaciones de Bodega, Recetas, Cocina, Pedidos, Dashboard
│   ├── testing/                   # Protocolos de prueba
│   └── workflow/                  # Políticas de git y merge
├── legacy/                        # Archivo histórico de prototipos monolíticos (v1 a 6.1)
├── src/
│   ├── core/                      # Tipos, cálculos puros, formateadores y storage
│   ├── components/                # Barra de navegación y componentes reutilizables
│   ├── features/                  # Módulos de negocio (bodega, cocina, recetario, pedidos, etc.)
│   ├── App.tsx                    # Shell reactivo principal
│   └── main.tsx                   # Punto de entrada
├── tests/
│   ├── unit/                      # Tests unitarios con Vitest
│   └── e2e/                       # Tests en navegador con Playwright
└── playwright.config.ts
```

Para más detalles, consulta el [Centro de Documentación](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/README.md).
