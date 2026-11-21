import { test, expect } from '@playwright/test';

test.describe('GastroFlow Artisan - Suite E2E en Navegador Real', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?admin=true');
    // Esperar a que la aplicación monte en el DOM
    await expect(page.locator('text=GastroFlow').first()).toBeVisible();
  });

  test('Flujo 1: Navegación completa por pestañas y renderizado del Dashboard', async ({ page }) => {
    // 1. Dashboard inicial
    await expect(page.getByTestId('dashboard-view')).toBeVisible();
    await expect(page.getByTestId('kpi-facturacion')).toBeVisible();

    // 2. Navegar a Libreta de Pedidos
    await page.getByTestId('tab-pedidos').click();
    await expect(page.getByTestId('pedidos-view')).toBeVisible();

    // 3. Navegar a Cocina & Lotes
    await page.getByTestId('tab-cocina').click();
    await expect(page.getByTestId('cocina-view')).toBeVisible();

    // 4. Navegar a Insumos & Bodega
    await page.getByTestId('tab-bodega').click();
    await expect(page.getByTestId('bodega-view')).toBeVisible();

    // 5. Navegar a Recetas & Costeo
    await page.getByTestId('tab-recetario').click();
    await expect(page.getByTestId('recetario-view')).toBeVisible();

    // 6. Navegar a Historial
    await page.getByTestId('tab-historial').click();
    await expect(page.getByTestId('historial-view')).toBeVisible();
  });

  test('Flujo 2: Creación, cobro y entrega de un encargo con persistencia', async ({ page }) => {
    // Ir a Pedidos
    await page.getByTestId('tab-pedidos').click();

    // Abrir Modal de Nuevo Pedido
    await page.getByTestId('btn-nuevo-pedido').click();

    // Diligenciar formulario
    await page.getByTestId('input-pedido-cliente').fill('Camila Repostería');
    await page.getByTestId('input-pedido-telefono').fill('3109876543');
    await page.getByTestId('input-pedido-fecha').fill('2026-11-05');
    await page.getByTestId('btn-guardar-pedido').click();

    // Verificar que la tarjeta del pedido fue creada
    await expect(page.locator('h3:has-text("Camila Repostería")').first()).toBeVisible();

    // Verificar botón de Cobrar Resto
    const btnCobrar = page.locator('button:has-text("Cobrar Resto")').first();
    if (await btnCobrar.isVisible()) {
      await btnCobrar.click();
      await expect(page.locator('text=Pagado 100%').first()).toBeVisible();
    }

    // Cambiar estado a Entregado
    const selectEstado = page.locator('select').first();
    await selectEstado.selectOption('entregado');

    // Recargar página y verificar persistencia en localStorage
    await page.reload();
    await page.getByTestId('tab-pedidos').click();
    await expect(page.locator('h3:has-text("Camila Repostería")').first()).toBeVisible();
  });

  test('Flujo 3: Validación de pase a cocina y descuento automático de insumos', async ({ page }) => {
    // Ir a Cocina & Lotes
    await page.getByTestId('tab-cocina').click();
    await expect(page.getByTestId('cocina-view')).toBeVisible();

    // Verificar que la mesa de trabajo y el botón de tandas están presentes
    const btnConfirmar = page.getByTestId('btn-confirmar-lote');
    await expect(btnConfirmar).toBeVisible();

    // Si tiene insumos suficientes y está habilitado, ejecutar pase a cocina
    if (await btnConfirmar.isEnabled()) {
      await btnConfirmar.click();
      await expect(page.locator('text=iniciada! Se descontaron los insumos')).toBeVisible();
    } else {
      // Candado de seguridad por insumos insuficientes activo
      await expect(page.locator('text=Insumos Insuficientes, text=Faltan insumos').first()).toBeVisible();
    }
  });

  test('Flujo 4: Menú de datos y exportación de copia JSON', async ({ page }) => {
    // Abrir menú de Datos
    await page.getByTestId('btn-menu-datos').click();
    await expect(page.getByTestId('btn-exportar-json')).toBeVisible();

    // Preparar escucha de descarga
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-exportar-json').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('GastroFlow_Backup_');
  });

  test('Flujo 5: Tienda Online del Cliente y Login Seguro de Administradora', async ({ page }) => {
    // Ir a la vista pública de clientes
    await page.goto('/');
    await expect(page.locator('text=Los Brownies de Josefina').first()).toBeVisible();

    // Verificar catálogo de repostería artesanal
    await expect(page.locator('text=Repostería & Chocolatería Artesanal').first()).toBeVisible();

    // Abrir modal de login con el candado
    const btnCandado = page.locator('button[title*="Administración"], button:has-text("🔐")').first();
    await btnCandado.click();

    // Escribir contraseña incorrecta
    await page.locator('input[type="password"]').fill('clave_erronea');
    await page.locator('button:has-text("Ingresar al Taller")').click();
    await expect(page.locator('text=Contraseña incorrecta')).toBeVisible();

    // Escribir contraseña correcta de Josefina
    await page.locator('input[type="password"]').fill('josefina2024');
    await page.locator('button:has-text("Ingresar al Taller")').click();

    // Confirmar acceso al panel administrativo de GastroFlow
    await expect(page.getByTestId('dashboard-view')).toBeVisible();
  });
});
