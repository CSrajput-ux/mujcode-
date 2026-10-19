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
      rescanLanguage: (languageKey: string) => Promise<any>;

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

interface LanguageDisplayMeta {
  icon: string;
  name: string;
  wingetId?: string;
  publisher?: string;
  packageName?: string;
  estimatedSizeMb?: number;
}

const LANGUAGE_META: Record<string, LanguageDisplayMeta> = {
  c: {
    icon: '⚡',
    name: 'C — GCC / MinGW-w64',
    wingetId: 'MSYS2.MSYS2',
    publisher: 'MSYS2 Project',
    packageName: 'MinGW-w64 GCC Compiler Toolchain',
    estimatedSizeMb: 120
  },
  cpp: {
    icon: '⚙️',
    name: 'C++ — G++ / MinGW-w64',
    wingetId: 'MSYS2.MSYS2',
    publisher: 'MSYS2 Project',
    packageName: 'MinGW-w64 G++ Compiler Toolchain',
    estimatedSizeMb: 120
  },
  java: {
    icon: '☕',
    name: 'Java — OpenJDK / Temurin JDK',
    wingetId: 'EclipseAdoptium.Temurin.21.JDK',
    publisher: 'Eclipse Foundation',
    packageName: 'Eclipse Temurin OpenJDK 21 (JDK)',
    estimatedSizeMb: 190
  },
  python: {
    icon: '🐍',
    name: 'Python — Python 3.12',
    wingetId: 'Python.Python.3.12',
    publisher: 'Python Software Foundation',
    packageName: 'Python 3.12 Runtime',
    estimatedSizeMb: 35
  },
  javascript: {
    icon: '🟨',
    name: 'JavaScript — Node.js LTS',
    wingetId: 'OpenJS.NodeJS.LTS',
    publisher: 'OpenJS Foundation',
    packageName: 'Node.js LTS Runtime',
    estimatedSizeMb: 30
  },
  go: {
    icon: '🔵',
    name: 'Go — Go compiler',
    wingetId: 'Golang.Go',
    publisher: 'Google LLC / Go Authors',
    packageName: 'Go Programming Language Compiler',
    estimatedSizeMb: 130
  },
  sql: {
    icon: '🗄️',
    name: 'SQL — Bundled SQLite WASM'
  }
};

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

  interface PackageModalItem {
    languageKeys: string[];
    displayName: string;
    wingetId: string;
    packageName: string;
    publisher: string;
    estimatedSizeMb?: number;
    installationMethod: string;
    permissions: string;
  }

  let currentDiagnostics: any[] = [];
  const installingLanguages = new Set<string>();
  const verifyingLanguages = new Set<string>();
  const failedLanguages = new Map<string, string>();
  let pendingPackagesToInstall: PackageModalItem[] = [];
  let isInstalling = false;

  function openConsentModal(items: PackageModalItem[]) {
    if (!consentModal || !modalPackageList) return;
    if (items.length === 0) {
      showAlert('No missing language toolchains to install.', 'warning');
      return;
    }

    pendingPackagesToInstall = items;
    modalPackageList.innerHTML = items
      .map(
        (item) => `
      <div class="package-item">
        <div>
          <div class="package-name">${escapeHtml(item.displayName)}</div>
          <div class="package-meta">
            <strong>Package:</strong> ${escapeHtml(item.packageName)} &bull;
            <strong>ID:</strong> <span class="mono">${escapeHtml(item.wingetId)}</span> &bull;
            <strong>Publisher:</strong> ${escapeHtml(item.publisher)}
            ${item.estimatedSizeMb ? ` &bull; <strong>Est. Size:</strong> ~${escapeHtml(String(item.estimatedSizeMb))} MB` : ''}<br/>
            <strong>Method:</strong> ${escapeHtml(item.installationMethod)} &bull;
            <strong>Permissions:</strong> ${escapeHtml(item.permissions)}
          </div>
        </div>
        <span class="badge connected">Winget Verified</span>
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
    pendingPackagesToInstall = [];
  });

  modalConfirmBtn?.addEventListener('click', async () => {
    if (isInstalling || !pendingPackagesToInstall.length) return;
    isInstalling = true;
    modalConfirmBtn.disabled = true;
    if (modalCancelBtn) modalCancelBtn.disabled = true;
    if (consentCheckbox) consentCheckbox.disabled = true;

    // Mark all affected languages as installing
    for (const pkg of pendingPackagesToInstall) {
      for (const lKey of pkg.languageKeys) {
        installingLanguages.add(lKey);
        failedLanguages.delete(lKey);
      }
    }
    renderDiagnosticsGrid();

    if (modalInstallStatus) {
      modalInstallStatus.style.display = 'block';
      modalInstallStatus.className = 'info-message';
      modalInstallStatus.textContent = 'Initiating Microsoft Winget package installation...';
    }

    try {
      for (let i = 0; i < pendingPackagesToInstall.length; i++) {
        const pkg = pendingPackagesToInstall[i];
        if (!pkg.wingetId) continue;

        if (modalInstallStatus) {
          modalInstallStatus.textContent = `[${i + 1}/${pendingPackagesToInstall.length}] Installing ${pkg.displayName} (${pkg.wingetId})... This may take 1-3 minutes.`;
        }
        showAlert(`Installing ${pkg.displayName} via Winget (${pkg.wingetId})...`, 'info');

        const res = await api!.installToolchain(pkg.wingetId);

        if (!res.success) {
          for (const lKey of pkg.languageKeys) {
            failedLanguages.set(lKey, res.output || 'Installation failed.');
          }
          showAlert(`Failed to install ${pkg.displayName}: ${res.output.slice(-150)}`, 'error');
          if (modalInstallStatus) {
            modalInstallStatus.className = 'info-message error';
            modalInstallStatus.textContent = `Installation failed for ${pkg.displayName}: ${res.output.slice(-200)}`;
          }
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          // Verification: Re-scan installed executable
          for (const lKey of pkg.languageKeys) {
            try {
              const updated = await api!.rescanLanguage(lKey);
              const idx = currentDiagnostics.findIndex((d) => d.languageKey === lKey);
              if (idx >= 0) currentDiagnostics[idx] = updated;

              if (updated.available) {
                failedLanguages.delete(lKey);
              } else {
                failedLanguages.set(
                  lKey,
                  'Installed via Winget, but executable was not found on PATH. A restart of the MUJCODE application may be required.'
                );
              }
            } catch (err: any) {
              failedLanguages.set(lKey, `Verification error: ${err.message}`);
            }
          }
          showAlert(`Installed and verified ${pkg.displayName}!`, 'success');
        }
      }

      if (modalInstallStatus) {
        modalInstallStatus.className = 'info-message success';
        modalInstallStatus.textContent = 'Installation process finished! Updating diagnostics...';
      }

      await new Promise((r) => setTimeout(r, 1200));
      consentModal?.classList.add('hidden');
    } catch (err: any) {
      showAlert(`Installation error: ${err.message}`, 'error');
    } finally {
      for (const pkg of pendingPackagesToInstall) {
        for (const lKey of pkg.languageKeys) {
          installingLanguages.delete(lKey);
        }
      }
      pendingPackagesToInstall = [];
      isInstalling = false;
      if (modalConfirmBtn) modalConfirmBtn.disabled = false;
      if (modalCancelBtn) modalCancelBtn.disabled = false;
      if (consentCheckbox) consentCheckbox.disabled = false;
      updateHealthSummary();
      renderDiagnosticsGrid();
    }
  });

  function handleInstallLanguage(langKey: string) {
    if (installingLanguages.has(langKey)) return;

    if (langKey === 'c' || langKey === 'cpp') {
      openConsentModal([
        {
          languageKeys: ['c', 'cpp'],
          displayName: 'C & C++ Toolchain (MinGW-w64 GCC / G++)',
          wingetId: 'MSYS2.MSYS2',
          packageName: 'MinGW-w64 GCC / G++ Toolchain',
          publisher: 'MSYS2 Project',
          estimatedSizeMb: 120,
          installationMethod: 'Microsoft Windows Package Manager (Winget CLI)',
          permissions: 'Standard User (elevates if required by installer)'
        }
      ]);
      return;
    }

    const diag = currentDiagnostics.find((d) => d.languageKey === langKey);
    const meta = LANGUAGE_META[langKey];
    const wId = diag?.wingetId || meta?.wingetId;

    if (!wId) {
      showAlert(`No automated Winget package configured for ${meta?.name || langKey}. Please install manually.`, 'warning');
      return;
    }

    openConsentModal([
      {
        languageKeys: [langKey],
        displayName: meta?.name || diag?.runtimeName || langKey,
        wingetId: wId,
        packageName: diag?.packageName || meta?.packageName || wId,
        publisher: diag?.publisher || meta?.publisher || 'Verified Package Publisher',
        estimatedSizeMb: diag?.estimatedSizeMb || meta?.estimatedSizeMb || 50,
        installationMethod: 'Microsoft Windows Package Manager (Winget CLI)',
        permissions: 'Standard User'
      }
    ]);
  }

  async function handleVerifyLanguage(langKey: string) {
    if (verifyingLanguages.has(langKey) || installingLanguages.has(langKey)) return;
    verifyingLanguages.add(langKey);
    renderDiagnosticsGrid();

    try {
      const updated = await api!.rescanLanguage(langKey);
      const idx = currentDiagnostics.findIndex((d) => d.languageKey === langKey);
      if (idx >= 0) currentDiagnostics[idx] = updated;

      if (langKey === 'c' || langKey === 'cpp') {
        const siblingKey = langKey === 'c' ? 'cpp' : 'c';
        const siblingUpdated = await api!.rescanLanguage(siblingKey);
        const sIdx = currentDiagnostics.findIndex((d) => d.languageKey === siblingKey);
        if (sIdx >= 0) currentDiagnostics[sIdx] = siblingUpdated;
      }

      const meta = LANGUAGE_META[langKey];
      if (updated.available) {
        failedLanguages.delete(langKey);
        showAlert(`${meta?.name || langKey} verified! ${updated.detectedVersion || 'OK'}`, 'success');
      } else {
        showAlert(`${meta?.name || langKey} verification completed: not found on system PATH.`, 'warning');
      }
    } catch (err: any) {
      showAlert(`Verification error for ${langKey}: ${err.message}`, 'error');
    } finally {
      verifyingLanguages.delete(langKey);
      updateHealthSummary();
      renderDiagnosticsGrid();
    }
  }

  function handleRetryLanguage(langKey: string) {
    failedLanguages.delete(langKey);
    if (langKey === 'c' || langKey === 'cpp') {
      failedLanguages.delete('c');
      failedLanguages.delete('cpp');
    }
    handleInstallLanguage(langKey);
  }

  function updateHealthSummary() {
    const availableCount = currentDiagnostics.filter((d) => d.available).length;
    const missingCount = currentDiagnostics.length - availableCount;

    healthSummary.textContent = `${availableCount} of ${currentDiagnostics.length} Available`;
    healthSummary.className = `badge ${availableCount === currentDiagnostics.length ? 'connected' : 'connecting'}`;

    if (missingCount > 0) {
      setupBanner?.classList.remove('hidden');
      if (setupMissingCount) setupMissingCount.textContent = `${missingCount} Missing`;
    } else {
      setupBanner?.classList.add('hidden');
    }
  }

  function renderDiagnosticsGrid() {
    const ORDERED_LANG_KEYS = ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'sql'];
    currentDiagnostics.sort((a, b) => {
      const ia = ORDERED_LANG_KEYS.indexOf(a.languageKey);
      const ib = ORDERED_LANG_KEYS.indexOf(b.languageKey);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    diagnosticsGrid.innerHTML = currentDiagnostics
      .map((d) => {
        const langKey = d.languageKey;
        const meta = LANGUAGE_META[langKey] || {
          icon: '💻',
          name: d.runtimeName
        };

        const isInstallingNow = installingLanguages.has(langKey);
        const isVerifyingNow = verifyingLanguages.has(langKey);
        const isFailedNow = failedLanguages.has(langKey);
        const isAvail = Boolean(d.available);
        const isWasm = Boolean(d.isBundled);
        const hasSmoke = Boolean(d.smokeTestPassed);

        let cardClass = 'diag-card';
        let statusTagClass = 'status-tag';
        let statusText = '';
        let versionText = '';
        let pathText = '';

        if (isInstallingNow) {
          cardClass += ' installing';
          statusTagClass += ' installing';
          statusText = 'Installing...';
          versionText = 'Installing package via Winget...';
          pathText = d.wingetId ? `Package ID: ${d.wingetId}` : 'In progress...';
        } else if (isFailedNow) {
          cardClass += ' failed';
          statusTagClass += ' failed';
          statusText = 'Failed';
          versionText = 'Installation or verification failed';
          pathText = 'Executable not found on PATH';
        } else if (isAvail) {
          cardClass += ' available';
          statusTagClass += ' ok';
          statusText = isWasm ? 'Available — Bundled' : 'Installed';
          versionText = d.detectedVersion || 'Installed';
          pathText = isWasm ? 'sql.js (Bundled in-process WASM)' : (d.executablePath || 'Path resolved');
        } else {
          cardClass += ' missing';
          statusTagClass += ' missing';
          statusText = 'Missing';
          versionText = 'Not installed on host system';
          pathText = 'Not configured on system PATH';
        }

        // Action button
        let actionButtonHtml = '';
        if (isInstallingNow) {
          actionButtonHtml = `<button class="btn-card-action btn-installing" disabled><span class="spinner-small"></span> Installing...</button>`;
        } else if (isVerifyingNow) {
          actionButtonHtml = `<button class="btn-card-action btn-verify" disabled>Verifying...</button>`;
        } else if (isFailedNow) {
          actionButtonHtml = `<button class="btn-card-action btn-retry" data-action="retry" data-lang="${escapeHtml(langKey)}">🔄 Retry Install</button>`;
        } else if (isAvail) {
          actionButtonHtml = `<button class="btn-card-action btn-verify" data-action="verify" data-lang="${escapeHtml(langKey)}">${isWasm ? 'Verify WASM Engine' : 'Verify / Rescan'}</button>`;
        } else {
          actionButtonHtml = `<button class="btn-card-action btn-install" data-action="install" data-lang="${escapeHtml(langKey)}">⬇ Download & Install</button>`;
        }

        // Smoke tag
        let smokeHtml = '';
        if (isAvail && hasSmoke) {
          smokeHtml = `<span class="diag-smoke-tag passed">✓ Verified Smoke Test</span>`;
        } else if (isAvail && hasSmoke === false) {
          smokeHtml = `<span class="diag-smoke-tag" style="background:rgba(239,68,68,0.15);color:#f87171;">⚠️ Smoke Test Failed</span>`;
        }

        // Error box
        let errorBoxHtml = '';
        if (isFailedNow && failedLanguages.has(langKey)) {
          errorBoxHtml = `<div class="diag-error-box">${escapeHtml(failedLanguages.get(langKey)!)}</div>`;
        }

        return `
          <div class="${cardClass}" id="card-lang-${escapeHtml(langKey)}">
            <div class="diag-header">
              <span class="diag-title">
                <span class="lang-icon">${meta.icon}</span>
                ${escapeHtml(meta.name)}
              </span>
              <span class="${statusTagClass}">${escapeHtml(statusText)}</span>
            </div>

            <div class="diag-detail" title="${escapeHtml(versionText)}">
              <strong>Version:</strong> ${escapeHtml(versionText)}
            </div>
            <div class="diag-detail mono" style="font-size:11px; opacity:0.85;" title="${escapeHtml(pathText)}">
              <strong>Path:</strong> ${escapeHtml(pathText)}
            </div>

            ${smokeHtml}
            ${errorBoxHtml}

            <div class="diag-card-footer">
              ${actionButtonHtml}
            </div>
          </div>
        `;
      })
      .join('');

    // Attach card button handlers
    diagnosticsGrid.querySelectorAll<HTMLButtonElement>('.btn-card-action').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const lang = btn.getAttribute('data-lang');
        if (!action || !lang) return;

        if (action === 'verify') {
          await handleVerifyLanguage(lang);
        } else if (action === 'install') {
          handleInstallLanguage(lang);
        } else if (action === 'retry') {
          handleRetryLanguage(lang);
        }
      });
    });
  }

  // Setup banner button clicks
  installMissingBtn?.addEventListener('click', () => {
    const missing = currentDiagnostics.filter((d) => !d.available && d.wingetId);
    if (!missing.length) {
      showAlert('All supported toolchains are either installed or require manual installation.', 'info');
      return;
    }

    const packagesMap = new Map<string, PackageModalItem>();
    for (const d of missing) {
      const meta = LANGUAGE_META[d.languageKey];
      const wId = d.wingetId || meta?.wingetId;
      if (!wId) continue;

      if (!packagesMap.has(wId)) {
        const isCShare = wId === 'MSYS2.MSYS2';
        packagesMap.set(wId, {
          languageKeys: isCShare ? ['c', 'cpp'] : [d.languageKey],
          displayName: isCShare ? 'C & C++ Toolchain (MinGW-w64 GCC / G++)' : (meta?.name || d.runtimeName),
          wingetId: wId,
          packageName: d.packageName || meta?.packageName || wId,
          publisher: d.publisher || meta?.publisher || 'Verified Package Publisher',
          estimatedSizeMb: d.estimatedSizeMb || meta?.estimatedSizeMb || 50,
          installationMethod: 'Microsoft Windows Package Manager (Winget CLI)',
          permissions: 'Standard User'
        });
      }
    }

    openConsentModal(Array.from(packagesMap.values()));
  });

  installSelectedBtn?.addEventListener('click', () => {
    const missing = currentDiagnostics.filter((d) => !d.available && d.wingetId);
    if (!missing.length) {
      showAlert('All supported toolchains are installed.', 'info');
      return;
    }
    installMissingBtn?.click();
  });

  rescanSystemBtn?.addEventListener('click', () => {
    refreshDiagnostics();
  });

  continueInstalledBtn?.addEventListener('click', () => {
    setupBanner?.classList.add('hidden');
    showAlert('Continuing with currently installed language runtimes. You can verify or install anytime.', 'info');
  });

  // --- Diagnostics ---
  async function refreshDiagnostics() {
    if (isScanning) return;
    isScanning = true;
    refreshDoctorBtn.disabled = true;
    refreshDoctorBtn.textContent = 'Scanning...';
    diagnosticsGrid.innerHTML = '<div class="loading-state">Diagnosing host toolchains (C, C++, Java, Python, Node.js, Go, SQLite WASM)...</div>';
    healthSummary.textContent = 'Scanning...';
    healthSummary.className = 'badge connecting';

    try {
      const diagnostics = await api!.getDiagnostics();
      if (!diagnostics || !Array.isArray(diagnostics) || diagnostics.length === 0) {
        throw new Error('No diagnostic data returned from compiler bridge.');
      }

      currentDiagnostics = diagnostics;
      updateHealthSummary();
      renderDiagnosticsGrid();
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
