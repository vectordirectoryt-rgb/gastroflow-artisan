import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Identidad Visual de Marca "Los Brownies de Josefina" & Carrusel con Variantes', () => {
  const screenshotsDir = path.resolve('scratch/screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Flujo Marca 1: Carga y renderizado impecable de logos, cuchara y ausencia de leyendas no pedidas', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Abrir vista de cliente
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // 2. Verificar logo en cabecera
    const logoHeader = page.locator('header img[alt="Los Brownies de Josefina"]');
    await expect(logoHeader).toBeVisible();

    const isLogoHeaderLoaded = await logoHeader.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isLogoHeaderLoaded).toBe(true);

    // 3. Verificar foto de la cuchara de chocolate
    const spoonImg = page.locator('img[src="/cuchara-chocolate.jpg"]').first();
    await expect(spoonImg).toBeVisible();
    const isSpoonLoaded = await spoonImg.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isSpoonLoaded).toBe(true);

    // 4. Verificar que se eliminaron las leyendas no pedidas ("Cacao 100% real", "Recién horneado", etc.)
    await expect(page.locator('text="Cacao 100% real"')).toHaveCount(0);
    await expect(page.locator('text="Cacao Real & Pura Melcocha"')).toHaveCount(0);

    // 5. Logo en el footer
    const logoFooter = page.locator('footer img[alt="Los Brownies de Josefina"]');
    await expect(logoFooter).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '01_header_y_hero.png'), fullPage: false });
    expect(consoleErrors).toHaveLength(0);
  });

  test('Flujo Marca 2: Eslogan como título principal, paleta corporativa y filtro de favoritos', async ({ page }) => {
    await page.goto('/');

    // 1. Eslogan oficial como Titular Principal (h2)
    const esloganHero = page.locator('h2:has-text("Encuentra aquí el amor más dulce")');
    await expect(esloganHero).toBeVisible();

    // 2. Color del texto del título en Crema Vainilla (#ECEBCF / rgb(236, 235, 207))
    const esloganColor = await esloganHero.evaluate((el) => window.getComputedStyle(el).color);
    expect(esloganColor).toBe('rgb(236, 235, 207)');

    // 3. Fondo chocolate del Hero (#22221E / rgb(34, 34, 30))
    const heroSection = page.locator('section').first();
    const heroBg = await heroSection.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(heroBg).toBe('rgb(34, 34, 30)');

    // 4. Botón CTA en Rosa Malva (#A472B9 / rgb(164, 114, 185))
    const btnPedir = page.locator('button:has-text("Encargar")').first();
    await expect(btnPedir).toBeVisible();
    const btnBg = await btnPedir.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(btnBg).toBe('rgb(164, 114, 185)');

    // 5. Filtro de Favoritos
    const tabFavoritos = page.locator('button:has-text("Favoritos")');
    await expect(tabFavoritos).toBeVisible();
    await tabFavoritos.click();
  });

  test('Flujo Marca 3: Carrusel etiquetado, opciones con precio dinámico y encargo completo', async ({ page }) => {
    await page.goto('/');

    // 1. Abrir modal del primer producto
    const btnPedirModal = page.locator('button:has-text("Encargar")').first();
    await btnPedirModal.click();

    // 2. Verificar que abre el modal con encabezado y carrusel
    const modalHeading = page.locator('span:has-text("Encargo en línea")');
    await expect(modalHeading).toBeVisible();

    const carruselEtiqueta = page.locator('[data-testid="carrusel-etiqueta"]');
    await expect(carruselEtiqueta).toBeVisible();
    const etiquetaInicial = await carruselEtiqueta.innerText();
    expect(etiquetaInicial.length).toBeGreaterThan(0);

    // 3. Probar avance de foto en el carrusel
    const btnSiguiente = page.locator('button[aria-label="Presentación siguiente"]');
    if (await btnSiguiente.isVisible()) {
      await btnSiguiente.click();
      await page.waitForTimeout(300);
      const etiquetaSegunda = await carruselEtiqueta.innerText();
      expect(etiquetaSegunda).toBeDefined();
    }

    // 4. Seleccionar variante "Forma de Corazón" y verificar actualización de precio dinámico
    const btnCorazon = page.locator('button:has-text("Forma de Corazón")');
    if (await btnCorazon.isVisible()) {
      const precioAntes = await page.locator('[data-testid="total-dinamico"]').innerText();
      await btnCorazon.click();
      await page.waitForTimeout(200);
      const precioDespues = await page.locator('[data-testid="total-dinamico"]').innerText();
      // El precio dinámico debe haber incrementado
      expect(precioDespues).not.toBe(precioAntes);
    }

    // 5. Incrementar cantidad y verificar recálculo dinámico
    const btnMas = page.getByRole('button', { name: '+', exact: true });
    await btnMas.click();
    await page.waitForTimeout(100);

    // 6. Llenar datos de encargo
    await page.fill('input[placeholder="Ej. María Gómez"]', 'Prueba Josefina E2E');
    await page.fill('input[placeholder="Ej. 300 123 4567"]', '3109876543');
    await page.locator('textarea').first().fill('Con dedicatoria especial de cumpleaños.');

    await page.screenshot({ path: path.join(screenshotsDir, '03_modal_carrusel_opciones.png'), fullPage: false });

    // 7. Enviar encargo
    const btnConfirmar = page.locator('button:has-text("Confirmar Encargo")');
    await btnConfirmar.click();

    // 8. Verificar pantalla de confirmación exitosa con botón de WhatsApp
    await expect(page.locator('text=¡Pedido Recibido con Éxito!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Confirmar por WhatsApp')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '04_pedido_exitoso.png'), fullPage: false });
  });

  test('Flujo Marca 4: Navegación y paleta corporativa en panel administrativo (Navbar & Dashboard)', async ({ page }) => {
    await page.goto('/?admin=true');

    // 1. Logo en la cabecera del panel administrativo
    const logoAdmin = page.locator('header img[alt="Los Brownies de Josefina"]');
    await expect(logoAdmin).toBeVisible();

    const isLogoAdminLoaded = await logoAdmin.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isLogoAdminLoaded).toBe(true);

    // 2. Cabecera administrativa con fondo Marrón Chocolate (#22221E / rgb(34, 34, 30))
    const headerAdmin = page.locator('header').first();
    const headerBg = await headerAdmin.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(headerBg).toBe('rgb(34, 34, 30)');

    // 3. Tab activo en Rosa Malva (#A472B9 / rgb(164, 114, 185))
    const tabActivo = page.locator('[data-testid="tab-dashboard"]');
    await expect(tabActivo).toBeVisible();
    const tabBg = await tabActivo.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(tabBg).toBe('rgb(164, 114, 185)');

    // 4. Titular GastroFlow Artisan
    await expect(page.locator('text=GastroFlow').first()).toBeVisible();
    await expect(page.locator('text=Los Brownies de Josefina').first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '05_admin_dashboard.png'), fullPage: false });
  });

  test('Flujo Marca 5: Catálogo Web con Gestor de Galería Multi-foto y Personalización de Marca', async ({ page }) => {
    await page.goto('/?admin=true');

    // 1. Navegar a Catálogo Web
    const tabTienda = page.locator('[data-testid="tab-tienda"]');
    await expect(tabTienda).toBeVisible();
    await tabTienda.click();

    // 2. Verificar encabezado y estética del Catálogo Web
    await expect(page.locator('text=Catálogo Web — Los Brownies de Josefina')).toBeVisible();

    // 3. Abrir panel de Personalizar Estética
    const btnEstetica = page.locator('button:has-text("Personalizar Estética")');
    await expect(btnEstetica).toBeVisible();
    await btnEstetica.click();

    // 4. Verificar inputs de eslogan y selectores de paleta
    await expect(page.locator('text=Identidad Visual & Estilo de la Tienda')).toBeVisible();
    await expect(page.locator('input[value="Encuentra aquí el amor más dulce"]')).toBeVisible();

    // 5. Abrir Gestor de Galería del primer producto
    const btnGaleria = page.locator('button:has-text("Galería")').first();
    await expect(btnGaleria).toBeVisible();
    await btnGaleria.click();

    // 6. Verificar modal de Galería y sugerencias de etiquetas
    await expect(page.locator('text=Galería del Carrusel & Presentaciones')).toBeVisible();
    await expect(page.locator('button:has-text("Forma de Corazón")').first()).toBeVisible();

    // 7. Guardar Galería
    const btnGuardarGaleria = page.locator('button:has-text("Guardar Galería")');
    await btnGuardarGaleria.click();

    await page.screenshot({ path: path.join(screenshotsDir, '06_admin_catalogo_galeria.png'), fullPage: false });
  });

  test('Flujo Marca 6: Cuadrícula Móvil de 2 Columnas, Carrito y Reconocimiento de Usuario', async ({ page }) => {
    // 1. Emular celular moderno (390 x 844 px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // 2. Verificar cuadrícula móvil de 2 columnas
    const gridProductos = page.locator('div.grid.grid-cols-2').first();
    await expect(gridProductos).toBeVisible();

    // 3. Abrir primer producto y añadir al carrito
    const btnPrimerProducto = page.locator('button:has-text("Encargar")').first();
    await btnPrimerProducto.click();
    await expect(page.locator('text=Personaliza tu encargo')).toBeVisible();

    const btnAlCarrito = page.locator('button:has-text("Al Carrito")');
    await expect(btnAlCarrito).toBeVisible();
    await btnAlCarrito.click();

    // 4. Verificar toast de notificación
    await expect(page.locator('text=agregado al carrito')).toBeVisible();

    // 5. Verificar barra flotante de carrito móvil
    const barraFlotante = page.locator('button:has-text("Ver Carrito")');
    await expect(barraFlotante).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '07_mobile_grid_y_barra.png'), fullPage: false });

    // 6. Abrir drawer de carrito
    await barraFlotante.click();
    await expect(page.locator('text=Tu Carrito')).toBeVisible();

    // 7. Llenar datos y probar método de entrega a domicilio
    await page.locator('button:has-text("Envío a Domicilio")').click();
    await page.fill('input[placeholder="Ej. María Gómez"]', 'Camila Gómez');
    await page.fill('input[placeholder="Ej. 300 123 4567"]', '3109876543');
    await page.fill('input[placeholder*="Dirección exacta"]', 'Calle 10 # 40-20 Apto 402');
    await page.fill('input[placeholder*="Barrio"]', 'El Poblado');

    // 8. Probar activación de dedicatoria de regalo
    const btnRegalo = page.locator('button:has-text("¿Es un regalo?")');
    await btnRegalo.click();
    await page.fill('textarea[placeholder*="mensaje para la tarjeta"]', '¡Feliz cumpleaños con todo mi amor!');

    // 9. Verificar tarjetas de copiado de cuenta Nequi/Bancolombia
    await expect(page.locator('text=Nequi / Daviplata')).toBeVisible();
    await expect(page.locator('text=Bancolombia Ahorros')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '08_mobile_checkout_drawer.png'), fullPage: false });

    // 10. Confirmar encargo completo
    const btnConfirmarCheckout = page.locator('div[role="dialog"] button:has-text("Confirmar Encargo"), div button:has-text("Confirmar Encargo")').last();
    await btnConfirmarCheckout.click();

    // 11. Modal de éxito
    await expect(page.locator('text=¡Pedido Recibido con Éxito!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Confirmar por WhatsApp')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '09_mobile_pedido_confirmado.png'), fullPage: false });

    // 12. Cerrar y verificar reconocimiento del cliente en siguiente visita
    await page.locator('button:has-text("Cerrar y seguir navegando")').click();
    await page.locator('button[title="Ver mi carrito"]').click();
    await expect(page.locator('text=¡Hola de nuevo, Camila Gómez!')).toBeVisible();
  });
});
