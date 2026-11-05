# 🌿 Flujo de Trabajo Git: Ramas, Commits & Protocolo de Merge

## 1. Política de Ramas

GastroFlow utiliza un modelo de ramas basado en características (*Feature Branching*) con una rama principal protegida:

- `main`: Rama de producción estable. Prohibido hacer commits directos.
- `feat/*`: Nuevas funcionalidades o módulos de negocio.
- `fix/*`: Correcciones de errores o inconsistencias.
- `test/*`: Incorporación de pruebas unitarias o pruebas E2E en navegador.
- `refactor/*`: Mejoras de código sin cambio funcional.
- `docs/*`: Actualizaciones de documentación.

---

## 2. Convención de Commits (Conventional Commits)

Cada commit debe describir claramente su propósito:

```
<tipo>(<alcance>): <descripción corta en presente/infinitivo>

[cuerpo opcional detallando el motivo del cambio]
```

**Ejemplos**:
- `feat(bodega): añadir filtro por tipo materia prima y empaque`
- `fix(recetas): corregir redondeo de costo por minuto en equipos trifásicos`
- `test(e2e): verificar flujo de cobro total de pedidos en navegador Chromium`
- `docs(cocina): documentar fórmula de disponibilidad de tandas`

---

## 3. Checklist Obligatorio Pre-Merge a `main`

Antes de fusionar una rama en `main`, el desarrollador o agente **DEBE COMPLETAR ESTA LISTA DE COMPROBACIÓN**:

- [ ] 1. Rama actualizada respecto a `main` (`git merge origin/main` o `git rebase main`).
- [ ] 2. Verificación de TypeScript estricto (`npm run lint`).
- [ ] 3. Suite de tests unitarios aprobada al 100% (`npm run test:unit`).
- [ ] 4. **Suite de tests en navegador real aprobada al 100% (`npm run test:e2e`)**.
- [ ] 5. Documentación actualizada en `docs/modules/` si hubo cambios funcionales.
- [ ] 6. Merge formal realizado mediante `--no-ff` para preservar el historial.

```bash
git checkout main
git merge --no-ff feat/mi-funcionalidad -m "merge(feat): integrar mi-funcionalidad tras aprobar tests unitarios y navegador"
```
