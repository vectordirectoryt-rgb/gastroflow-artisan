# 📜 AGENTS.md — Protocolo Estándar de Ingeniería & Calidad para GastroFlow

> **ESTÁNDAR OBLIGATORIO DE DESARROLLO**: Todo agente de Inteligencia Artificial y desarrollador que opere en este repositorio debe acatar estas directrices sin excepción. La calidad del código, la integridad financiera de las fórmulas gastronómicas y la validación en navegador real son principios no negociables.

---

## 🎯 1. Filosofía y Mentalidad del Ingeniero / Agente

1. **Proactividad Total**: No esperes a que el usuario reporte un error o solicite pruebas. Cada nueva función, corrección de bug o refactorización debe nacer acompañada de sus pruebas unitarias y de integración, así como de su prueba end-to-end (E2E) en navegador real.
2. **Cero Tolerancia a Regresiones Financieras**: GastroFlow calcula costos por gramo, rendimientos de lote, márgenes y sueldos reales por hora trabajada. Cualquier discrepancia matemática en centavos o en el cálculo de mermas e inventario compromete la economía del taller gastronómico.
3. **Respeto a la Arquitectura Modular**: Cada módulo de negocio (`bodega`, `recetario`, `cocina`, `pedidos`, `dashboard`, `historial`) debe mantener límites de dominio claros en `src/features/`.
4. **Documentación Viva**: Todo cambio de módulo o flujo de usuario debe reflejarse en la carpeta [docs/](file:///C:/Users/USER/OneDrive/Desktop/GastroFlow/docs/).

---

## 🌿 2. Ciclo de Vida de Git: Ramas, Commits y Merges

### 🚫 REGLA INQUEBRANTABLE: Prohibido commitear directo a `main`
La rama `main` es el canal de producción protegido. **Ningún cambio puede entrar directo a `main`**.

### A. Creación de Ramas de Trabajo
Toda tarea debe realizarse en una rama específica creada a partir del estado más reciente de `main`:

```bash
git checkout main
git pull
git checkout -b <tipo>/<nombre-descriptivo>
```

**Tipos de ramas permitidos**:
- `feat/nombre-de-funcionalidad` (Nuevas capacidades o módulos)
- `fix/descripcion-del-bug` (Corrección de errores o anomalías)
- `test/cobertura-modulo` (Ampliación o adición de suite de pruebas)
- `refactor/nombre-componente` (Mejoras estructurales sin cambiar comportamiento)
- `docs/nombre-documento` (Actualización de guías y especificaciones)

### B. Estándar de Commits (Conventional Commits)
Los commits deben ser atómicos, cohesivos y seguir la convención semántica:
- `feat(modulo): descripción concisa en infinitivo/presente`
- `fix(modulo): corregir cálculo de mermas en stock cero`
- `test(e2e): agregar prueba de flujo completo de pedido a despacho`
- `refactor(recetas): modularizar cálculo de consumo energético kWh`
- `docs(arquitectura): actualizar diagrama de flujo de cocina`

---

## 🚦 3. La Puerta de Calidad: Requisito Obligatorio de Tests

Antes de considerar cualquier rama lista para integrarse (`merge`) a `main`, **DEBEN SUPERARSE DOS BARRERAS OBLIGATORIAS**:

```
┌────────────────────────────────────────────────────────┐
│               RAMA DE TRABAJO (feat/...)                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
          [1] Pruebas Unitarias & Integración
              Comando: `npm run test:unit`
              Herramienta: Vitest (100% pasando)
                           │
                           ▼
          [2] Pruebas End-to-End en Navegador Real
              Comando: `npm run test:e2e`
              Herramienta: Playwright (Chromium/Headless)
                           │
                           ▼
   ┌───────────────────────────────────────────────────┐
   │ ¿Pasaron ambas suites y se actualizó la doc?       │
   └───────────┬───────────────────────────┬───────────┘
               │ SÍ                        │ NO
               ▼                           ▼
    ✅ AUTORIZADO EL MERGE        ❌ BLOQUEO TOTAL
    `git merge --no-ff`           PROHIBIDO MERGEAR A MAIN
```

> [!CAUTION]
> **REGLA DE MERGE INFLEXIBLE**:
> **«Si no se hacen pruebas en navegador, no puede mergearse a main.»**
> No se admiten excepciones. Si un agente o persona intenta hacer merge a `main` sin haber ejecutado y verificado `npm run test:e2e` contra el navegador real, incurre en una violación crítica del protocolo de GastroFlow.

---

## 🛠️ 4. Protocolo Paso a Paso para Agentes

Cada agente que reciba un requerimiento debe ejecutar rigurosamente este ciclo de 6 pasos:

### Paso 1: Exploración e Inspección
1. Consultar la documentación en `docs/modules/` para entender el impacto en el negocio.
2. Identificar el módulo correspondiente en `src/features/`.
3. Crear la rama: `git checkout -b feat/...` o `fix/...`.

### Paso 2: Implementación Modular
1. Codificar con TypeScript estricto. Respetar los tipos definidos en `src/core/types/`.
2. Mantener la UI responsiva con Tailwind CSS y paleta `brand`.
3. Garantizar persistencia offline sincronizada con `localStorage`.

### Paso 3: Pruebas Unitarias (`Vitest`)
1. Añadir o actualizar pruebas unitarias en `tests/unit/` o junto al módulo (`*.test.ts`).
2. Ejecutar:
   ```bash
   npm run test:unit
   ```
3. Verificar que todas las aserciones pasen en verde.

### Paso 4: Pruebas End-to-End en Navegador (`Playwright`)
1. Añadir o actualizar flujos E2E en `tests/e2e/`.
2. Ejecutar las pruebas en navegador:
   ```bash
   npm run test:e2e
   ```
3. Asegurarse de que el servidor de prueba levante, los elementos DOM interactúen, los modals respondan y el estado se preserve.

### Paso 5: Actualización de la Documentación
1. Registrar cambios o decisiones técnicas en `docs/modules/<modulo>.md` o en el registro de arquitectura.
2. Comprobar que los ejemplos de uso sigan siendo válidos.

### Paso 6: Integración y Merge a `main`
1. Asegurar que el árbol de trabajo esté limpio (`git status`).
2. Cambiar a `main` y traer cambios recientes:
   ```bash
   git checkout main
   git pull
   ```
3. Realizar el merge formal preservando la historia:
   ```bash
   git merge --no-ff <nombre-de-rama> -m "merge(<tipo>): integrar <nombre-de-rama> tras validar tests unitarios y navegador"
   ```
4. Eliminar la rama local una vez fusionada si ya no es requerida:
   ```bash
   git branch -d <nombre-de-rama>
   ```

---

## 📂 5. Estructura de Directorios del Proyecto

```
GastroFlow/
├── .github/workflows/ci.yml       # Integración Continua (Unit + E2E Playwright)
├── AGENTS.md                      # Este protocolo oficial
├── docs/                          # Centro de Documentación y Especificaciones
│   ├── README.md                  # Índice general de la documentación
│   ├── architecture/              # Decisiones arquitectónicas (ADRs)
│   ├── modules/                   # Especificación funcional de cada módulo
│   ├── testing/                   # Guía de testing unitario y en navegador
│   └── workflow/                  # Políticas de git, ramas y versionado
├── legacy/                        # Histórico de prototipos Gastroflow1 a 6.1
├── src/
│   ├── core/                      # Tipos globales, cálculos matemáticos, formateadores, storage
│   ├── components/ui/             # Primitivas de UI (Button, Modal, Input, Badge, Card)
│   ├── features/                  # Módulos verticales de negocio
│   │   ├── bodega/                # Insumos, empaques, stock, compras
│   │   ├── recetario/             # Recetas, escandallos, costos CIF y hora
│   │   ├── cocina/                # Pase de cocina, validación de stock, lotes
│   │   ├── pedidos/               # Libreta de encargos, estados, WhatsApp
│   │   ├── dashboard/             # KPIs financieros, agenda diaria, ránkings
│   │   └── historial/             # Mermas, entregas, auditoría
│   ├── App.tsx                    # Shell principal y navegación de pestañas
│   ├── main.tsx                   # Punto de entrada React
│   └── index.css                  # Directivas de Tailwind CSS
├── tests/
│   ├── unit/                      # Tests unitarios con Vitest
│   └── e2e/                       # Tests en navegador con Playwright
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## ⚡ 6. Comandos Clave de Operación

| Tarea | Comando | Propósito |
|---|---|---|
| Servidor de Desarrollo | `npm run dev` | Inicia Vite en `http://localhost:3000` con HMR |
| Verificación de Tipos | `npm run lint` | Valida TypeScript sin emitir archivos (`tsc --noEmit`) |
| Tests Unitarios | `npm run test:unit` | Ejecuta la suite de Vitest de forma aislada |
| Tests E2E en Navegador | `npm run test:e2e` | Ejecuta Playwright en navegador real (Headless) |
| Tests E2E Visibles | `npm run test:e2e:headed` | Abre Chromium visible para depurar interacción |
| Build de Producción | `npm run build` | Compila bundle optimizado en `dist/` |
