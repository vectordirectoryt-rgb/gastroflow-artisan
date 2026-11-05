# 📄 ADR-001: Migración de Archivo Monolítico CDN a Vite + React + TypeScript + Playwright

## Estado
**Aceptado**

## Contexto
GastroFlow inició como un prototipo monolítico en un único archivo HTML (`Gastroflow6.1.html`) de casi 3.000 líneas que cargaba React 18, Babel standalone, Tailwind CSS y Chart.js mediante CDNs externas.

Si bien este enfoque permitió prototipar rápidamente:
1. Carecía de control de versiones real (se gestionaba mediante nombres de archivo como `Gastroflow2.html`, `Gastroflow3.html`, etc.).
2. Requería compilar JSX en el cliente con Babel en tiempo de ejecución, lo que degradaba el rendimiento en dispositivos móviles o tablets de cocina.
3. No contaba con tipado estático, dejando expuestas fórmulas matemáticas y conversiones de unidades a errores en tiempo de ejecución.
4. No disponía de una suite automatizada de pruebas unitarias ni de pruebas en navegador real.

## Decisión
Se decide migrar la totalidad del sistema a un stack moderno modular:
1. **Vite**: Como empaquetador ultrarrápido con soporte nativo de módulos ES.
2. **React + TypeScript**: Para estructurar el código en componentes limpios y blindar los contratos de datos financieros con interfaces TypeScript estrictas.
3. **Tailwind CSS nativo**: Para eliminar la dependencia del script CDN y permitir purgado de estilos en producción.
4. **Vitest**: Para pruebas unitarias rápidas de los motores de costeo y validadores de despensa.
5. **Playwright**: Para pruebas end-to-end obligatorias en navegador real.

## Consecuencias
- **Positivas**:
  - Código altamente desacoplado, modular y fácil de mantener.
  - Velocidad de carga instantánea sin dependencia de CDNs de terceros ni conexión a internet.
  - Garantía de calidad mediante pruebas en navegador que bloquean cualquier merge defectuoso a `main`.
  - Mantenimiento de la compatibilidad total con los datos previamente almacenados en `localStorage`.
- **Mitigaciones**:
  - Se archivaron todos los archivos HTML históricos en `legacy/` para preservar la trazabilidad del proyecto.
