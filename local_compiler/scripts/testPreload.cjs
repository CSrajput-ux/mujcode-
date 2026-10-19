const { app, BrowserWindow } = require('electron');
const path = require('node:path');

async function main() {
  await app.whenReady();

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'dist', 'preload', 'index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const { registerIpcHandlers } = await import('../dist/main/ipcHandlers.js');
  registerIpcHandlers(win);

  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('[PRELOAD ERROR!]', preloadPath, error);
  });

  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log('[RENDERER CONSOLE]', level, message, line, sourceId);
  });

  await win.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'));

  setTimeout(async () => {
    const hasMujcode = await win.webContents.executeJavaScript('Boolean(window.mujcode)');
    console.log('window.mujcode is defined:', hasMujcode);
    const healthSummary = await win.webContents.executeJavaScript('document.getElementById("health-summary").textContent');
    console.log('healthSummary:', healthSummary);
    const badgeText = await win.webContents.executeJavaScript('document.getElementById("connection-badge").textContent');
    console.log('connectionBadge:', badgeText);
    const diagCardsCount = await win.webContents.executeJavaScript('document.querySelectorAll(".diag-card").length');
    console.log('Diagnostic cards count:', diagCardsCount);
    app.quit();
  }, 2500);
}

main().catch(err => {
  console.error(err);
  app.quit();
});
