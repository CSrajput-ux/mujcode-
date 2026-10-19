# MUJCODE Local Compiler — Clean-Machine Smoke Test Checklist
## Windows 10 / Windows 11 Verification Protocol

This document provides a repeatable, step-by-step verification protocol for QA engineers and security testers validating the **MUJCODE Local Compiler** desktop agent on a clean Windows environment prior to beta release.

---

## Prerequisites for the Clean Test Machine

- **Operating System**: Clean Windows 10 (Build 19045+) or Windows 11 (22H2+) 64-bit.
- **Account Type**: Standard non-administrator Windows user account (to verify per-user NSIS installation).
- **Initial State**: No developer compilers installed (no MinGW, no GCC/G++, no JDK, no Python, no Node.js).
- **Network**: Standard internet access (HTTPS/WSS to backend server).

---

## Test Execution Matrix

### Step 1: Installer Execution & SmartScreen Inspection
- [ ] **1.1 SmartScreen Prompt**: Double-click `MUJCODE-Local-Compiler-Setup-1.0.0.exe`.
  - *Expected*: Since the binary is unsigned in beta, Windows Defender SmartScreen displays: *"Windows protected your PC"*.
  - *Action*: Click **More info** -> **Run anyway**.
- [ ] **1.2 UAC Elevation Check**:
  - *Expected*: **No administrator prompt (UAC) appears**. Installation proceeds under `%LOCALAPPDATA%\Programs\mujcode-local-compiler`.
- [ ] **1.3 NSIS Wizard**:
  - *Expected*: Clean wizard titled "MUJCODE Local Compiler Setup".
  - *Action*: Follow prompts and complete installation.
- [ ] **1.4 Shortcut Verification**:
  - *Expected*: Start Menu entry "MUJCODE Local Compiler" is created.
  - *Expected*: Desktop is clean (no unwanted desktop icon).

---

### Step 2: First Launch & Zero-Dependency Experience
- [ ] **2.1 Application Launch**: Launch "MUJCODE Local Compiler" from the Windows Start Menu.
  - *Expected*: Window opens with dark theme, showing title *"MUJCODE Local Compiler Agent"*.
- [ ] **2.2 Runtime Doctor Initial State**:
  - *Expected*:
    - **SQL**: `Available` (Built-in SQLite engine ready).
    - **JavaScript**: `Available` (Built-in Node.js runtime).
    - **C / C++ / Java / Python / Go**: Accurately reported as **Missing / Not Installed**.
  - *Expected*: Each missing language displays an exact Windows installation command (e.g., `winget install Python.Python.3.11`).
  - *Critical*: The application does **not** crash or freeze when tools are missing.

---

### Step 3: Toolchain Installation & Dynamic Detection
- [ ] **3.1 Install Python via Winget**:
  - *Action*: Open PowerShell and run:
    ```powershell
    winget install Python.Python.3.11 --silent --accept-package-agreements
    ```
- [ ] **3.2 Toolchain Refresh**:
  - *Action*: Restart or refresh the desktop agent.
  - *Expected*: Python status immediately transitions from **Missing** to **Available** with version `Python 3.11.x`.

---

### Step 4: Device Pairing Workflow
- [ ] **4.1 Pairing Code Request**:
  - Log in to MUJCODE on the website as a student.
  - Open a coding problem in the editor.
  - In the problem header, click the **Local Compiler** widget.
  - Click **Generate Pairing Code**.
  - *Expected*: A 6-character alphanumeric code appears with a 5-minute countdown timer.
- [ ] **4.2 Code Submission on Desktop**:
  - Enter the 6-character code into the desktop application and click **Pair Device**.
  - *Expected*: Desktop agent contacts backend over TLS, exchanges the challenge, and stores the encrypted device credential via Windows DPAPI.
  - *Expected*: Desktop status changes to `CONNECTED` (Green badge).
  - *Expected*: Web widget updates to `Connected: [Student Device]` with execution toggle enabled.

---

### Step 5: Real Local Execution Verification
- [ ] **5.1 Python Execution**:
  - In the web editor, select Python 3.
  - Code: `print("Hello from Student Windows PC!")`
  - Click **Run Code**.
  - *Expected*: Code executes locally on the student's machine. Browser output shows:
    ```
    Hello from Student Windows PC!
    ```
    Status: `Successful`, exit code: `0`.
- [ ] **5.2 Missing Compiler Graceful Degradation (Go)**:
  - Select Go (which is not installed).
  - Click **Run Code**.
  - *Expected*: Result displays `DEPENDENCY_MISSING`:
    *"Go compiler is missing on local host. Install Go: winget install Golang.Go"*
  - *Critical*: Neither desktop app nor website crashes.

---

### Step 6: Security, Limits & Process Tree Cleanup
- [ ] **6.1 Infinite Loop & Process Timeout**:
  - Select Python.
  - Code: `while True: pass`
  - Click **Run Code**.
  - *Expected*: Process is forcefully killed after timeout (10 seconds) via `taskkill /T /F`.
  - *Expected*: Status returned is `TIME_LIMIT_EXCEEDED`. No orphan `python.exe` processes remain in Task Manager.
- [ ] **6.2 Output Buffer Truncation**:
  - Code: `print("A" * 500000)`
  - Click **Run Code**.
  - *Expected*: Output buffer is safely truncated at 256 KB with notice `[Output truncated]`. Browser does not hang.

---

### Step 7: Connection Resilience & Device Revocation
- [ ] **7.1 Persistence Across App Restarts**:
  - Close the desktop application.
  - Restart "MUJCODE Local Compiler".
  - *Expected*: Encrypted DPAPI token is restored from disk. Agent automatically reconnects to the backend without requiring re-pairing.
- [ ] **7.2 Device Revocation / Unpairing**:
  - On the website widget, click **Unpair Device**.
  - *Expected*: Token is revoked on backend. Desktop agent transitions to `PAIRING_REQUIRED`.
  - *Expected*: Subsequent run requests route to cloud fallback or prompt to reconnect.

---

### Step 8: Authoritative Server-Side Submit Boundary
- [ ] **8.1 Academic Integrity Check**:
  - Click **Submit Code** with local agent active.
  - *Expected*: The submission is graded **authoritatively by the backend server judge**.
  - *Critical*: Hidden test cases and benchmark inputs are **never sent to the student desktop agent**.

---

### Step 9: Clean Uninstallation
- [ ] **9.1 Uninstall from Windows Settings**:
  - Open **Settings** -> **Apps** -> **Installed Apps**.
  - Select **MUJCODE Local Compiler** -> **Uninstall**.
  - *Expected*: Uninstaller runs cleanly without error.
  - *Expected*: Application directory and Start Menu shortcut are completely removed.
  - *Expected*: Encrypted credentials under `%APPDATA%\mujcode-local-compiler` are deleted.
