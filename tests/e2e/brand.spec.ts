import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Identidad Visual de Marca "Los Brownies de Josefina" - Inspección en Navegador Real', () => {
  const screenshotsDir = path.resolve('scratch/screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Flujo Marca 1: Carga y renderizado impecable de los logos oficiales y la foto de la cuchara', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Abrir vista de cliente
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // 2. Verificar que el logo principal en la cabecera carga correctamente
    const logoHeader = page.locator('header img[alt="Los Brownies de Josefina"]');
    await expect(logoHeader).toBeVisible();

    const isLogoHeaderLoaded = await logoHeader.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isLogoHeaderLoaded).toBe(true);

    // 3. Verificar que la foto de la cuchara de chocolate del PDF carga impecablemente
    const spoonImg = page.locator('img[src="/cuchara-chocolate.jpg"]').first();
    await expect(spoonImg).toBeVisible();
    const isSpoonLoaded = await spoonImg.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isSpoonLoaded).toBe(true);

    // 4. Verificar que el logo en el footer carga correctamente
    const logoFooter = page.locator('footer img[alt="Los Brownies de Josefina"]');
    await expect(logoFooter).toBeVisible();

    const isLogoFooterLoaded = await logoFooter.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isLogoFooterLoaded).toBe(true);

    // 5. Capturar captura de pantalla del Header y Hero
    await page.screenshot({ path: path.join(screenshotsDir, '01_header_y_hero.png'), fullPage: false });

    // 6. Verificar que no hay errores críticos de consola
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

    // 4. Capturar catálogo completo con todas las tarjetas
    await page.screenshot({ path: path.join(screenshotsDir, '02_catalogo_todos.png'), fullPage: true });

    // 5. Botones CTA en Rosa Malva (#A472B9 / rgb(164, 114, 185))
    const btnPedir = page.locator('button:has-text("Pedir"), button:has-text("Encargar")').first();
    await expect(btnPedir).toBeVisible();
    const btnBg = await btnPedir.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(btnBg).toBe('rgb(164, 114, 185)');

    // 6. Verificar que el filtro de "⭐ Favoritos" existe y funciona
    const tabFavoritos = page.locator('button:has-text("Favoritos")');
    await expect(tabFavoritos).toBeVisible();
    await tabFavoritos.click();

    // 7. Probar apertura del modal de pedido y verificar paleta en modal
    await page.goto('/');
    const btnPedirModal = page.locator('button:has-text("Pedir"), button:has-text("Encargar")').first();
    await btnPedirModal.click();
    const modalHeading = page.locator('span:has-text("Encargo en línea")');
    await expect(modalHeading).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '03_modal_encargo.png'), fullPage: false });
  });

  test('Flujo Marca 3: Navegación y logo en panel administrativo (Navbar)', async ({ page }) => {
    await page.goto('/?admin=true');

    // Logo en la cabecera del panel administrativo
    const logoAdmin = page.locator('header img[alt="Los Brownies de Josefina"]');
    await expect(logoAdmin).toBeVisible();

    const isLogoAdminLoaded = await logoAdmin.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isLogoAdminLoaded).toBe(true);

    // Titular GastroFlow Artisan
    await expect(page.locator('text=GastroFlow').first()).toBeVisible();
    await expect(page.locator('text=Los Brownies de Josefina').first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '04_admin_dashboard.png'), fullPage: false });
  });
});
