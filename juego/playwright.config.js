// Pruebas de referencia del juego en navegador (Chromium con WebGL por software).
// Perfiles: Android (Pixel 7) e iPhone 14 con pantalla táctil emulada, más escritorio.
// OJO: el perfil «iphone» usa Chromium con el tamaño, la escala y el táctil de un
// iPhone; no es Safari/WebKit real (WebKit no está instalado en este entorno).
import { defineConfig, devices } from '@playwright/test';

const PORT = 5180;
const gl = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const landscape = (d) => ({ ...d, viewport: { width: d.viewport.height, height: d.viewport.width } });

export default defineConfig({
  testDir: './tests',
  timeout: 15 * 60_000,
  expect: { timeout: 30_000 },
  workers: 1,
  reporter: [['list']],
  outputDir: './tests/.results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { args: gl },
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'android', use: { ...landscape(devices['Pixel 7']), browserName: 'chromium' } },
    { name: 'iphone', use: { ...landscape(devices['iPhone 14']), browserName: 'chromium', defaultBrowserType: 'chromium' } },
    { name: 'escritorio', use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
