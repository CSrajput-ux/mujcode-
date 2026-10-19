const { app, BrowserWindow } = require('electron');
const path = require('node:path');

async function runVerification() {
  await app.whenReady();

  const win = new BrowserWindow({
    show: false,
    width: 1024,
    height: 768,
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
    console.error('PRELOAD_ERROR:', preloadPath, error);
  });

  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log(`RENDERER_LOG [level ${level}]: ${message}`);
  });

  await win.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'));

  // Wait 1.5s for initial DOM and toolchain scan
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n--- VERIFICATION 1: INITIAL STATE & TOOLCHAIN SCAN ---');
  const hasMujcode = await win.webContents.executeJavaScript('Boolean(window.mujcode)');
  console.log('window.mujcode available:', hasMujcode);

  const initialBadge = await win.webContents.executeJavaScript('document.getElementById("connection-badge").textContent');
  console.log('Initial Connection Badge:', initialBadge);

  const healthSummary = await win.webContents.executeJavaScript('document.getElementById("health-summary").textContent');
  console.log('Toolchain Health Summary:', healthSummary);

  const diagCardsCount = await win.webContents.executeJavaScript('document.querySelectorAll(".diag-card").length');
  console.log('Diagnostic cards rendered:', diagCardsCount);

  console.log('\n--- VERIFICATION 2: CLICK "CONNECT" ON UNPAIRED DEVICE ---');
  await win.webContents.executeJavaScript('document.getElementById("connect-toggle-btn").click()');
  await new Promise(r => setTimeout(r, 500));

  const alertAfterConnect = await win.webContents.executeJavaScript('document.getElementById("connection-alert").textContent');
  const alertClassAfterConnect = await win.webContents.executeJavaScript('document.getElementById("connection-alert").className');
  console.log('Alert after clicking Connect:', alertAfterConnect);
  console.log('Alert class:', alertClassAfterConnect);

  console.log('\n--- VERIFICATION 3: CLICK "PAIR DEVICE" WITH USER CHALLENGE (LOCAL DEV) ---');
  await win.webContents.executeJavaScript(`
    document.getElementById("pairing-code-input").value = "PAIR-A719E5A5";
    document.getElementById("pairing-server-url").value = "http://localhost:5000";
    document.getElementById("submit-pairing-btn").click();
  `);

  await new Promise(r => setTimeout(r, 1200));

  const alertAfterLocalPair = await win.webContents.executeJavaScript('document.getElementById("connection-alert").textContent');
  console.log('Alert after Local Dev pairing attempt:', alertAfterLocalPair);

  console.log('\n--- VERIFICATION 4: CLICK "PAIR DEVICE" AGAINST PRODUCTION (RENDER) ---');
  await win.webContents.executeJavaScript(`
    document.getElementById("pairing-code-input").value = "PAIR-A719E5A5";
    document.getElementById("pairing-server-url").value = "https://mujcode-1.onrender.com";
    document.getElementById("submit-pairing-btn").click();
  `);

  // Wait for remote round-trip
  await new Promise(r => setTimeout(r, 2500));

  const alertAfterProdPair = await win.webContents.executeJavaScript('document.getElementById("connection-alert").textContent');
  const pairBtnProdDisabled = await win.webContents.executeJavaScript('document.getElementById("submit-pairing-btn").disabled');
  console.log('Alert after Production pairing attempt:', alertAfterProdPair);
  console.log('Pair button disabled state:', pairBtnProdDisabled);

  console.log('\n--- VERIFICATION 5: CLICK "SCAN TOOLCHAINS" RE-SCAN ---');
  await win.webContents.executeJavaScript('document.getElementById("refresh-doctor-btn").click()');
  await new Promise(r => setTimeout(r, 800));

  const healthSummaryAfterScan = await win.webContents.executeJavaScript('document.getElementById("health-summary").textContent');
  console.log('Toolchain Health Summary after manual re-scan:', healthSummaryAfterScan);

  console.log('\n--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
  app.quit();
}

runVerification().catch(err => {
  console.error('VERIFICATION_EXCEPTION:', err);
  app.quit();
});
