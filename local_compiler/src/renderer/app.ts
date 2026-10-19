/**
 * MUJCODE Local Compiler — Renderer Dashboard Controller
 */

declare global {
  interface Window {
    mujcode?: {
      // Compiler
      executeCode: (req: any) => Promise<any>;
      getDiagnostics: () => Promise<any[]>;
      getSupportedLanguages: () => Promise<any[]>;
      openExternalUrl: (url: string) => Promise<any>;
      installToolchain: (wingetId: string) => Promise<{ success: boolean; output: string }>;

      // Networking & Pairing
      getConnectionState: () => Promise<{ status: string; lastError: string | null; backendUrl?: string }>;
      getPairingStatus: () => Promise<any>;
      connect: () => Promise<{ success: boolean; error?: string }>;
      disconnect: () => Promise<{ success: boolean; error?: string }>;
      submitPairingCode: (code: string, backendUrl?: string) => Promise<{ success: boolean; userDisplayName?: string; error?: string }>;
      unpair: () => Promise<{ success: boolean; error?: string }>;
      onConnectionStateChanged: (listener: (event: any) => void) => () => void;
    };
  }
}

const SAMPLE_CODES: Record<string, string> = {
  python: `print("Hello from MUJCODE Local Compiler!")\nfor i in range(1, 6):\n    print(f"Count: {i}")`,
  javascript: `console.log("Hello from Local JavaScript Engine!");\nconst items = ['C', 'C++', 'Java', 'Python', 'Go', 'SQL'];\nconsole.log("Supported Languages:", items.join(", "));`,
  sql: `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);\nINSERT INTO users VALUES (1, 'Alice', 'Student'), (2, 'Bob', 'Faculty');\nSELECT * FROM users;`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello from Local GCC on Windows!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::cout << "Hello from Local G++!" << std::endl;\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Local OpenJDK on Windows!");\n    }\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Local Go!")\n}`
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function initApp() {
  const statusLight = document.getElementById('status-light')!;
  const connectionBadge = document.getElementById('connection-badge')!;
  const connectToggleBtn = document.getElementById('connect-toggle-btn') as HTMLButtonElement;
  const connectionAlert = document.getElementById('connection-alert')!;

  const unpairedView = document.getElementById('unpaired-view')!;
  const pairedView = document.getElementById('paired-view')!;
  const pairingServerUrlInput = document.getElementById('pairing-server-url') as HTMLInputElement | null;
  const pairingCodeInput = document.getElementById('pairing-code-input') as HTMLInputElement;
  const submitPairingBtn = document.getElementById('submit-pairing-btn') as HTMLButtonElement;
  const pairingMessage = document.getElementById('pairing-message')!;
  const unpairBtn = document.getElementById('unpair-btn') as HTMLButtonElement;

  const pairedUserName = document.getElementById('paired-user-name')!;
  const pairedDeviceId = document.getElementById('paired-device-id')!;
  const pairedServerUrl = document.getElementById('paired-server-url')!;

  const diagnosticsGrid = document.getElementById('diagnostics-grid')!;
  const healthSummary = document.getElementById('health-summary')!;
  const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
  const codeInput = document.getElementById('code-input') as HTMLTextAreaElement;
  const codeOutput = document.getElementById('code-output')!;
  const runCodeBtn = document.getElementById('run-code-btn') as HTMLButtonElement;
  const refreshDoctorBtn = document.getElementById('refresh-doctor-btn') as HTMLButtonElement;
  const metricsDisplay = document.getElementById('execution-metrics')!;

  const api = window.mujcode;

  if (!api) {
    if (diagnosticsGrid) {
      diagnosticsGrid.innerHTML = '<div class="diag-card missing">Bridge API not detected (running outside Electron or preload failed)</div>';
    }
    if (connectionAlert) {
      connectionAlert.textContent = 'Preload bridge unavailable. Please restart the MUJCODE Local Compiler application.';
      connectionAlert.className = 'alert-box alert-error';
    }
    console.error('[Renderer] window.mujcode is undefined!');
    return;
  }

  // --- Concurrency Guards ---
  let isConnecting = false;
  let isPairing = false;
  let isScanning = false;
  let isExecuting = false;

  function showAlert(message: string, type: 'info' | 'success' | 'warning' | 'error' | 'none') {
    if (!connectionAlert) return;
    if (type === 'none' || !message) {
      connectionAlert.textContent = '';
      connectionAlert.className = 'alert-box hidden';
    } else {
      connectionAlert.textContent = message;
      connectionAlert.className = `alert-box alert-${type}`;
    }
  }

  // --- Connection Status Management ---
  function updateConnectionUI(status: string, error?: string | null) {
    connectionBadge.textContent = status;
    connectionBadge.className = 'badge';
    statusLight.className = 'status-indicator';

    switch (status) {
      case 'CONNECTED':
        statusLight.classList.add('online');
        connectionBadge.classList.add('connected');
        connectToggleBtn.textContent = 'Disconnect';
        connectToggleBtn.className = 'btn secondary';
        break;
      case 'CONNECTING':
      case 'RECONNECTING':
        statusLight.classList.add('connecting');
        connectionBadge.classList.add('connecting');
        connectToggleBtn.textContent = 'Connecting...';
        connectToggleBtn.className = 'btn secondary';
        break;
      case 'ERROR':
        statusLight.classList.add('error');
        connectionBadge.classList.add('error');
        connectToggleBtn.textContent = 'Retry Connect';
        connectToggleBtn.className = 'btn primary';
        break;
      case 'PAIRING_REQUIRED':
        statusLight.classList.add('offline');
        connectionBadge.classList.add('connecting');
        connectToggleBtn.textContent = 'Connect';
        connectToggleBtn.className = 'btn primary';
        break;
      case 'DISCONNECTED':
      default:
        statusLight.classList.add('offline');
        connectToggleBtn.textContent = 'Connect';
        connectToggleBtn.className = 'btn primary';
        break;
    }

    if (error) {
      showAlert(error, 'error');
    }
  }

  async function refreshPairingAndConnection() {
    try {
      const connState = await api!.getConnectionState();
      updateConnectionUI(connState.status, connState.lastError);

      if (pairingServerUrlInput && connState.backendUrl && !pairingServerUrlInput.value) {
        pairingServerUrlInput.value = connState.backendUrl;
      }

      const pairingStatus = await api!.getPairingStatus();
      if (pairingStatus.isPaired) {
        unpairedView.classList.add('hidden');
        pairedView.classList.remove('hidden');
        pairedUserName.textContent = pairingStatus.userDisplayName || 'Student';
        pairedDeviceId.textContent = pairingStatus.deviceId || '-';
        pairedServerUrl.textContent = pairingStatus.backendUrl || '-';
      } else {
        pairedView.classList.add('hidden');
        unpairedView.classList.remove('hidden');
      }
    } catch (err: any) {
      console.error('Failed to refresh pairing status:', err);
      showAlert(`Error reading device pairing state: ${err.message}`, 'error');
    }
  }

  // Listen for real-time connection state updates from Main process
  api.onConnectionStateChanged((event) => {
    updateConnectionUI(event.status, event.reason);
    if (event.status === 'CONNECTED') {
      showAlert('Connected securely to MUJCODE Cloud.', 'success');
    } else if (event.status === 'DISCONNECTED' && event.reason) {
      showAlert(`Disconnected: ${event.reason}`, 'info');
    }
  });

  // Connect / Disconnect Toggle
  connectToggleBtn.addEventListener('click', async () => {
    if (isConnecting) return;

    try {
      const pairingStatus = await api!.getPairingStatus();
      if (!pairingStatus.isPaired) {
        showAlert('Device is not paired yet. Please enter your pairing code below and click Pair Device.', 'warning');
        pairingCodeInput?.focus();
        return;
      }

      const currentState = connectionBadge.textContent;
      if (currentState === 'CONNECTED' || currentState === 'CONNECTING' || currentState === 'RECONNECTING') {
        isConnecting = true;
        connectToggleBtn.disabled = true;
        connectToggleBtn.textContent = 'Disconnecting...';
        showAlert('Disconnecting from MUJCODE Cloud...', 'info');

        const res = await api!.disconnect();
        if (res.success) {
          showAlert('Disconnected successfully.', 'info');
        } else {
          showAlert(`Disconnect error: ${res.error}`, 'error');
        }
      } else {
        isConnecting = true;
        connectToggleBtn.disabled = true;
        connectToggleBtn.textContent = 'Connecting...';
        updateConnectionUI('CONNECTING');
        showAlert('Connecting to MUJCODE Cloud gateway...', 'info');

        const res = await api!.connect();
        if (!res.success) {
          updateConnectionUI('ERROR', res.error);
          showAlert(`Connection failed: ${res.error || 'Server unreachable'}`, 'error');
        } else {
          showAlert('Connected to MUJCODE Cloud successfully.', 'success');
        }
      }
    } catch (err: any) {
      updateConnectionUI('ERROR', err.message);
      showAlert(`Connection exception: ${err.message}`, 'error');
    } finally {
      isConnecting = false;
      connectToggleBtn.disabled = false;
      await refreshPairingAndConnection();
    }
  });

  // Pairing Submission
  submitPairingBtn.addEventListener('click', async () => {
    if (isPairing) return;

    const code = pairingCodeInput.value.trim();
    if (!code) {
      showAlert('Please enter a pairing challenge code (e.g. PAIR-A719E5A5).', 'error');
      pairingMessage.textContent = 'Challenge code is required.';
      pairingMessage.className = 'info-message error';
      pairingCodeInput.focus();
      return;
    }

    if (!/^[a-zA-Z0-9_\-]{6,64}$/.test(code)) {
      showAlert('Invalid challenge format. Code must be 6-64 characters alphanumeric (e.g. PAIR-A719E5A5).', 'error');
      pairingMessage.textContent = 'Invalid format.';
      pairingMessage.className = 'info-message error';
      return;
    }

    const customBackend = pairingServerUrlInput?.value.trim() || undefined;

    isPairing = true;
    submitPairingBtn.disabled = true;
    submitPairingBtn.textContent = 'Pairing...';
    showAlert(`Connecting to backend${customBackend ? ` (${customBackend})` : ''} and redeeming challenge code...`, 'info');
    pairingMessage.textContent = 'Redeeming challenge...';
    pairingMessage.className = 'info-message';

    try {
      const res = await api!.submitPairingCode(code, customBackend);
      if (res.success) {
        const userName = res.userDisplayName || 'Student account';
        showAlert(`Device paired successfully as ${userName}! Connecting to cloud...`, 'success');
        pairingMessage.textContent = `Paired as ${userName}!`;
        pairingMessage.className = 'info-message success';
        pairingCodeInput.value = '';
        await refreshPairingAndConnection();
      } else {
        const err = res.error || 'Pairing failed. The code may be invalid, expired, or already used.';
        showAlert(err, 'error');
        pairingMessage.textContent = err;
        pairingMessage.className = 'info-message error';
      }
    } catch (err: any) {
      const errMsg = `Pairing failed: ${err.message || err}`;
      showAlert(errMsg, 'error');
      pairingMessage.textContent = errMsg;
      pairingMessage.className = 'info-message error';
    } finally {
      isPairing = false;
      submitPairingBtn.disabled = false;
      submitPairingBtn.textContent = 'Pair Device';
    }
  });

  // Unpair
  unpairBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to unpair this device from your MUJCODE account?')) {
      try {
        showAlert('Unpairing device and revoking local token...', 'info');
        await api!.unpair();
        showAlert('Device unpaired successfully.', 'info');
        await refreshPairingAndConnection();
      } catch (err: any) {
        showAlert(`Failed to unpair: ${err.message}`, 'error');
      }
    }
  });

  await refreshPairingAndConnection();

  // --- Populate Languages ---
  try {
    const languages = await api.getSupportedLanguages();
    languageSelect.innerHTML = languages
      .map((l) => `<option value="${escapeHtml(l.key)}">${escapeHtml(l.name)}</option>`)
      .join('');

    codeInput.value = SAMPLE_CODES['python'] || '';

    languageSelect.addEventListener('change', () => {
      const selected = languageSelect.value;
      if (SAMPLE_CODES[selected]) {
        codeInput.value = SAMPLE_CODES[selected];
      }
    });
  } catch (err) {
    console.error('Failed to load supported languages:', err);
  }

  // --- Missing Runtimes Setup & Consent Modal Elements ---
  const setupBanner = document.getElementById('setup-banner');
  const setupMissingCount = document.getElementById('setup-missing-count');
  const installMissingBtn = document.getElementById('install-missing-btn') as HTMLButtonElement | null;
  const installSelectedBtn = document.getElementById('install-selected-btn') as HTMLButtonElement | null;
  const rescanSystemBtn = document.getElementById('rescan-system-btn') as HTMLButtonElement | null;
  const continueInstalledBtn = document.getElementById('continue-installed-btn') as HTMLButtonElement | null;

  const consentModal = document.getElementById('consent-modal');
  const modalPackageList = document.getElementById('modal-package-list');
  const consentCheckbox = document.getElementById('consent-checkbox') as HTMLInputElement | null;
  const modalInstallStatus = document.getElementById('modal-install-status');
  const modalCancelBtn = document.getElementById('modal-cancel-btn') as HTMLButtonElement | null;
  const modalConfirmBtn = document.getElementById('modal-confirm-btn') as HTMLButtonElement | null;

  let currentDiagnostics: any[] = [];
  const selectedLanguages = new Set<string>();
  let pendingPackagesToInstall: any[] = [];
  let isInstalling = false;

  function openConsentModal(items: any[]) {
    if (!consentModal || !modalPackageList) return;
    if (items.length === 0) {
      showAlert('No missing language toolchains selected for installation.', 'warning');
      return;
    }

    pendingPackagesToInstall = items;
    modalPackageList.innerHTML = items
      .map(
        (item) => `
      <div class="package-item">
        <div>
          <div class="package-name">${escapeHtml(item.packageName || item.runtimeName)}</div>
          <div class="package-meta">
            ID: <span class="mono">${escapeHtml(item.wingetId || 'N/A')}</span> •
            Publisher: ${escapeHtml(item.publisher || 'Verified Package')}
            ${item.estimatedSizeMb ? ` • ~${escapeHtml(String(item.estimatedSizeMb))} MB` : ''} •
            Permissions: Standard User
          </div>
        </div>
        <span class="badge ${item.wingetId ? 'connected' : 'error'}">${item.wingetId ? 'Winget Verified' : 'Manual'}</span>
      </div>
    `
      )
      .join('');

    if (consentCheckbox) consentCheckbox.checked = false;
    if (modalConfirmBtn) modalConfirmBtn.disabled = true;
    if (modalInstallStatus) {
      modalInstallStatus.style.display = 'none';
      modalInstallStatus.textContent = '';
      modalInstallStatus.className = 'info-message';
    }

    consentModal.classList.remove('hidden');
  }

  consentCheckbox?.addEventListener('change', () => {
    if (modalConfirmBtn) {
      modalConfirmBtn.disabled = !consentCheckbox.checked || isInstalling;
    }
  });

  modalCancelBtn?.addEventListener('click', () => {
    if (isInstalling) return;
    consentModal?.classList.add('hidden');
  });

  modalConfirmBtn?.addEventListener('click', async () => {
    if (isInstalling || !pendingPackagesToInstall.length) return;
    isInstalling = true;
    if (modalConfirmBtn) modalConfirmBtn.disabled = true;
    if (modalCancelBtn) modalCancelBtn.disabled = true;
    if (consentCheckbox) consentCheckbox.disabled = true;

    if (modalInstallStatus) {
      modalInstallStatus.style.display = 'block';
      modalInstallStatus.className = 'info-message';
      modalInstallStatus.textContent = 'Starting package installation via Microsoft Winget...';
    }

    try {
      for (let i = 0; i < pendingPackagesToInstall.length; i++) {
        const pkg = pendingPackagesToInstall[i];
        if (!pkg.wingetId) continue;

        if (modalInstallStatus) {
          modalInstallStatus.textContent = `[${i + 1}/${pendingPackagesToInstall.length}] Installing ${pkg.packageName || pkg.runtimeName} (${pkg.wingetId})... This may take 1-3 minutes.`;
        }

        const res = await api!.installToolchain(pkg.wingetId);
        if (!res.success) {
          if (modalInstallStatus) {
            modalInstallStatus.className = 'info-message error';
            modalInstallStatus.textContent = `Installation failed for ${pkg.runtimeName}: ${res.output.slice(-200)}`;
          }
          showAlert(`Failed to install ${pkg.runtimeName}: ${res.output.slice(-150)}`, 'error');
          await new Promise((r) => setTimeout(r, 2500));
        } else {
          showAlert(`Installed ${pkg.runtimeName} successfully!`, 'success');
        }
      }

      if (modalInstallStatus) {
        modalInstallStatus.className = 'info-message success';
        modalInstallStatus.textContent = 'Installation process completed! Verifying toolchains...';
      }

      await new Promise((r) => setTimeout(r, 1200));
      consentModal?.classList.add('hidden');
      await refreshDiagnostics();
    } catch (err: any) {
      showAlert(`Installation error: ${err.message}`, 'error');
      if (modalInstallStatus) {
        modalInstallStatus.className = 'info-message error';
        modalInstallStatus.textContent = `Error: ${err.message}`;
      }
    } finally {
      isInstalling = false;
      if (modalConfirmBtn) modalConfirmBtn.disabled = false;
      if (modalCancelBtn) modalCancelBtn.disabled = false;
      if (consentCheckbox) consentCheckbox.disabled = false;
    }
  });

  // Setup banner button clicks
  installMissingBtn?.addEventListener('click', () => {
    const missing = currentDiagnostics.filter((d) => !d.available && d.wingetId);
    if (!missing.length) {
      showAlert('All supported toolchains are either installed or require manual installation.', 'info');
      return;
    }
    openConsentModal(missing);
  });

  installSelectedBtn?.addEventListener('click', () => {
    const selected = currentDiagnostics.filter((d) => !d.available && selectedLanguages.has(d.language) && d.wingetId);
    if (!selected.length) {
      showAlert('Please check one or more missing toolchains in the grid below to install.', 'warning');
      return;
    }
    openConsentModal(selected);
  });

  rescanSystemBtn?.addEventListener('click', () => {
    refreshDiagnostics();
  });

  continueInstalledBtn?.addEventListener('click', () => {
    setupBanner?.classList.add('hidden');
    showAlert('Continuing with currently installed language runtimes. You can rescan or install at any time.', 'info');
  });

  // --- Diagnostics ---
  async function refreshDiagnostics() {
    if (isScanning) return;
    isScanning = true;
    refreshDoctorBtn.disabled = true;
    refreshDoctorBtn.textContent = 'Scanning...';
    diagnosticsGrid.innerHTML = '<div class="loading-state">Diagnosing host toolchains (GCC, G++, Java, Python, Go, Node.js, SQLite)...</div>';
    healthSummary.textContent = 'Scanning...';
    healthSummary.className = 'badge connecting';

    try {
      const diagnostics = await api!.getDiagnostics();
      if (!diagnostics || !Array.isArray(diagnostics) || diagnostics.length === 0) {
        throw new Error('No diagnostic data returned from compiler bridge.');
      }

      currentDiagnostics = diagnostics;
      const availableCount = diagnostics.filter((d) => d.available).length;
      const missingList = diagnostics.filter((d) => !d.available);

      healthSummary.textContent = `${availableCount} of ${diagnostics.length} Available`;
      healthSummary.className = `badge ${availableCount === diagnostics.length ? 'connected' : 'connecting'}`;

      if (missingList.length > 0) {
        setupBanner?.classList.remove('hidden');
        if (setupMissingCount) setupMissingCount.textContent = `${missingList.length} Missing`;
      } else {
        setupBanner?.classList.add('hidden');
      }

      diagnosticsGrid.innerHTML = diagnostics
        .map((d) => {
          const isAvail = d.available;
          const isWasm = Boolean(d.isBundled);
          const hasSmoke = Boolean(d.smokeTestPassed);

          return `
            <div class="diag-card ${isAvail ? 'available' : 'missing'}">
              <div class="diag-header">
                <span class="diag-title">${escapeHtml(d.runtimeName)}</span>
                <span class="status-tag ${isAvail ? 'ok' : 'missing'}">${isAvail ? (isWasm ? 'BUNDLED' : 'READY') : 'MISSING'}</span>
              </div>
              <div class="diag-detail" title="${escapeHtml(d.executablePath || '')}">
                ${escapeHtml(isAvail ? (d.detectedVersion || 'Installed') : 'Not found on system')}
              </div>
              ${isAvail && hasSmoke ? `<span class="diag-smoke-tag passed">✓ Smoke Test Passed</span>` : ''}
              ${!isAvail && d.wingetId ? `
                <div class="diag-pkg-meta">Winget: ${escapeHtml(d.packageName || d.wingetId)}</div>
                <label class="diag-checkbox-label">
                  <input type="checkbox" class="toolchain-select-cb" data-lang="${escapeHtml(d.language)}" ${selectedLanguages.has(d.language) ? 'checked' : ''} />
                  <span>Select for installation</span>
                </label>
              ` : ''}
              ${d.troubleshootingInstructions ? `<div class="diag-help">${escapeHtml(d.troubleshootingInstructions)}</div>` : ''}
            </div>
          `;
        })
        .join('');

      // Wire checkboxes
      const checkboxes = diagnosticsGrid.querySelectorAll<HTMLInputElement>('.toolchain-select-cb');
      checkboxes.forEach((cb) => {
        cb.addEventListener('change', () => {
          const lang = cb.getAttribute('data-lang');
          if (lang) {
            if (cb.checked) {
              selectedLanguages.add(lang);
            } else {
              selectedLanguages.delete(lang);
            }
          }
        });
      });
    } catch (err: any) {
      healthSummary.textContent = 'Scan Error';
      healthSummary.className = 'badge error';
      diagnosticsGrid.innerHTML = `
        <div class="diag-card missing" style="grid-column: 1 / -1;">
          <div class="diag-header">
            <span class="diag-title">Diagnostics Scan Failed</span>
            <span class="status-tag missing">ERROR</span>
          </div>
          <div class="diag-detail" style="color:#f87171;">${escapeHtml(err?.message || String(err))}</div>
          <button id="retry-doctor-btn" class="btn secondary" style="margin-top:10px; width:fit-content;">Retry Scan</button>
        </div>
      `;
      document.getElementById('retry-doctor-btn')?.addEventListener('click', refreshDiagnostics);
    } finally {
      isScanning = false;
      refreshDoctorBtn.disabled = false;
      refreshDoctorBtn.textContent = 'Scan Toolchains';
    }
  }

  refreshDoctorBtn.addEventListener('click', refreshDiagnostics);
  await refreshDiagnostics();

  // --- Local Sandbox Execution ---
  runCodeBtn.addEventListener('click', async () => {
    if (isExecuting) return;
    isExecuting = true;
    runCodeBtn.disabled = true;
    runCodeBtn.textContent = 'Executing...';
    metricsDisplay.textContent = '';
    codeOutput.textContent = 'Running code in local sandbox...';

    const lang = languageSelect.value;
    const code = codeInput.value;

    try {
      const result = await api!.executeCode({
        requestId: `req_${Date.now()}`,
        language: lang,
        sourceCode: code,
        timeLimitMs: 3000
      });

      metricsDisplay.textContent = `Status: ${result.status} | Verdict: ${result.verdict} | Time: ${result.executionTimeMs}ms`;

      if (result.status === 'SUCCESS') {
        codeOutput.textContent = result.stdout || 'Program executed with no standard output.';
        codeOutput.style.color = '#38bdf8';
      } else if (result.status === 'DEPENDENCY_MISSING') {
        codeOutput.textContent = `[DEPENDENCY MISSING]\n${result.stderr}`;
        codeOutput.style.color = '#f59e0b';
      } else if (result.status === 'COMPILATION_ERROR') {
        codeOutput.textContent = `[COMPILATION ERROR]\n${result.compileError || result.stderr}`;
        codeOutput.style.color = '#ef4444';
      } else if (result.status === 'TIME_LIMIT_EXCEEDED') {
        codeOutput.textContent = `[TIME LIMIT EXCEEDED]\n${result.stderr}`;
        codeOutput.style.color = '#f97316';
      } else {
        codeOutput.textContent = `[ERROR: ${result.status}]\n${result.stderr || result.stdout || 'Unknown error'}`;
        codeOutput.style.color = '#f87171';
      }
    } catch (err: any) {
      codeOutput.textContent = `IPC Error: ${err.message}`;
      codeOutput.style.color = '#ef4444';
    } finally {
      isExecuting = false;
      runCodeBtn.disabled = false;
      runCodeBtn.textContent = 'Execute Sample';
    }
  });
}

// Ensure initApp executes regardless of whether DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
