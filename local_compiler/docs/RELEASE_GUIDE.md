# MUJCODE Local Compiler — Windows Packaging & Release Guide

This document defines the release engineering, Windows packaging pipeline, dependency detection, code-signing configuration, and deployment workflow for the **MUJCODE Local Compiler** desktop agent.

---

## 1. Architecture & Release Overview

- **Application Name**: MUJCODE Local Compiler
- **Package Id (`appId`)**: `com.mujcode.localcompiler`
- **Target OS / Architecture**: Windows 10/11 x64 (AMD64)
- **Packaging Framework**: `electron-builder` v25.1+ with NSIS (Nullsoft Scriptable Install System)
- **Installation Mode**: Per-user installation (`perMachine: false`, `oneClick: false`). Does not require Windows Administrator privileges.
- **Shortcut Configuration**: Start Menu shortcut enabled; Desktop shortcut disabled by default (no clutter).
- **Default Installation Path**: `%LOCALAPPDATA%\Programs\mujcode-local-compiler\`

---

## 2. Build Prerequisites

To package the Windows desktop installer from source, the build system must have:

1. **Operating System**: Windows 10 or Windows 11 (64-bit).
2. **Node.js**: v20.0.0 or higher (v20 LTS or v22 LTS recommended).
3. **npm**: v9 or higher (bundled with Node.js).
4. **Python**: v3.10+ (for asset processing and build scripts).
5. **Git**: Installed and available in system PATH.
6. **Network Access**: Outbound HTTPS access to GitHub to download NSIS and Electron release binaries during packaging.

---

## 3. Dependency Installation & Development Launch

```powershell
# Navigate to the local_compiler directory
cd local_compiler

# Install all runtime and development dependencies
npm install

# Verify TypeScript compilation and type definitions
npm run typecheck

# Run runtime doctor to detect installed compilers on the host
npm run dev:doctor

# Execute the automated test suite (46 unit & integration tests)
npm test

# Launch the desktop agent in development mode
npm run start
```

---

## 4. Production Build & Packaging Commands

Packaging is configured through standard npm scripts defined in `package.json`:

### A. Compile Source & Copy Assets
```powershell
npm run build
```
*Compiles TypeScript to `dist/` and runs `scripts/buildAssets.js` to copy `index.html` and `styles.css` to `dist/renderer/`.*

### B. Generate Unpacked Directory (`pack:win`)
```powershell
npm run pack:win
```
*Compiles the application and generates the unpacked standalone folder under `release/win-unpacked/` containing `MUJCODE Local Compiler.exe` without packaging into an installer archive. Ideal for fast local verification.*

### C. Generate Production NSIS Installer (`dist:win`)
```powershell
npm run dist:win
```
*Generates the final standalone installer executable: `release/MUJCODE-Local-Compiler-Setup-1.0.0.exe`.*

---

## 5. Build Artifact Verification & Output Locations

All build artifacts are written to `local_compiler/release/` (which is excluded from Git in `.gitignore`):

| Artifact File | Typical File Size | Description |
| :--- | :--- | :--- |
| `MUJCODE-Local-Compiler-Setup-1.0.0.exe` | ~88.60 MB | Standalone NSIS Windows setup installer for students/users |
| `MUJCODE-Local-Compiler-Setup-1.0.0.exe.blockmap` | ~86 KB | Differential update blockmap for Electron auto-updater |
| `release/win-unpacked/` | ~188 MB | Unpacked application directory with `MUJCODE Local Compiler.exe` |

### Verifying Installer Integrity (PowerShell)
```powershell
# Compute SHA256 checksum of generated installer
Get-FileHash -Algorithm SHA256 .\release\MUJCODE-Local-Compiler-Setup-1.0.0.exe

# Verify packaged ASAR content does not contain .env or dev files
npx asar list "release\win-unpacked\resources\app.asar" | Select-String -Pattern "\.env|test|node_modules\\electron"
```

---

## 6. Supported Language & Runtime Dependency Matrix

The MUJCODE Local Compiler desktop agent bridges code execution to the student's local machine for seven languages. Compilers are **NOT** bundled with the installer to prevent bloated installer sizes, licensing violations, and security risks.

The application automatically diagnoses installed compilers on launch and displays actionable installation commands:

| Language | Identifier (`languageId`) | Detection Mechanism | Recommended Windows Installation Command |
| :--- | :--- | :--- | :--- |
| **C** | `50` / `c` | `gcc.exe --version` | `winget install MSYS2.MSYS2` or MinGW-w64 |
| **C++** | `54` / `cpp` | `g++.exe --version` | `winget install MSYS2.MSYS2` or MinGW-w64 |
| **Java** | `62` / `java` | `javac.exe -version` | `winget install Oracle.JDK.21` or Eclipse Temurin |
| **Python** | `71` / `python` | `python.exe --version` | `winget install Python.Python.3.11` |
| **JavaScript** | `63` / `javascript` | `node.exe --version` | `winget install OpenJS.NodeJS.LTS` |
| **Go** | `60` / `go` | `go.exe version` | `winget install Golang.Go` |
| **SQL** | `82` / `sql` | Built-in SQLite WebAssembly (`sql.js`) | **Always Available** (No installation needed) |

> **Important**: If Go or any other compiler is not installed on the student's machine, the desktop runtime doctor displays a yellow status indicator with the exact `winget` command. If a student attempts to run a job for a missing compiler, the agent returns status `DEPENDENCY_MISSING` with instructions without crashing.

---

## 7. Installation, Launch & Pairing Workflow

1. **Step 1: Download & Install**
   - Download `MUJCODE-Local-Compiler-Setup-1.0.0.exe` from the MUJCODE portal.
   - Run the installer. Choose installation folder (default is per-user app directory).
   - The installer automatically creates a Start Menu entry: **MUJCODE Local Compiler**.

2. **Step 2: Launch the Desktop Agent**
   - Launch **MUJCODE Local Compiler** from the Windows Start Menu.
   - The desktop window shows:
     - Real-time compiler readiness matrix (which languages are available).
     - Connection status indicator (`DISCONNECTED` / `WAITING_FOR_PAIRING`).
     - Input field for entering the 6-character MUJCODE Pairing Code.

3. **Step 3: Pair from the MUJCODE Website**
   - Log in to MUJCODE website and open any problem in the Code Editor.
   - Click the **Local Compiler** widget in the problem solver header.
   - Click **Generate Pairing Code** (displays a 6-character code valid for 5 minutes).
   - Enter the 6-character code into the desktop application and click **Pair Device**.
   - The desktop client exchanges the challenge code with the backend over TLS and receives an authenticated, cryptographically signed device token.

4. **Step 4: Execute Code Locally**
   - On the website, the widget updates to **Connected: [Device Name]**.
   - When the student clicks **Run Code**, the backend routes the execution job directly to their local desktop agent over the authenticated Socket.IO channel.
   - Results, compilation errors, and execution timings appear in the browser output panel in real time.
   - Clicking **Submit** continues to run on the authoritative, secure server-side judge to guarantee academic integrity.

---

## 8. Code Signing & Windows SmartScreen

### Current Signing Status
The release installer generated in development/CI is **unsigned** (`no signing info identified, signing is skipped`).

### Windows SmartScreen Notice
Because the installer is unsigned, Windows Defender SmartScreen will display an informational banner when the installer is launched:
> *"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting."*

To install during testing/pilot rollout:
1. Click **More info**.
2. Click **Run anyway**.

### Configuring Production Code Signing
When an EV (Extended Validation) or Standard Authenticode Code Signing Certificate is provisioned:

1. Export the certificate to a `.p1x` or `.pfx` file.
2. Set the following environment variables in your secure CI/CD build runner (GitHub Actions / GitLab CI):
   ```powershell
   $env:CSC_LINK = "path/to/certificate.pfx"
   $env:CSC_KEY_PASSWORD = "SecretPassword"
   ```
3. Run `npm run dist:win`.
4. `electron-builder` will automatically detect the certificate via `signtool.exe` and sign:
   - `release/win-unpacked/MUJCODE Local Compiler.exe`
   - `release/win-unpacked/resources/elevate.exe`
   - `release/__uninstaller-nsis-mujcode-local-compiler.exe`
   - `release/MUJCODE-Local-Compiler-Setup-1.0.0.exe`

---

## 9. Website Download Integration (`LocalCompilerWidget`)

The MUJCODE frontend exposes the download action through `frontend/src/components/LocalCompilerWidget.tsx`:

- **Environment Variable**: `VITE_LOCAL_COMPILER_DOWNLOAD_URL`
- **Configuration in `.env.production`**:
  ```env
  VITE_LOCAL_COMPILER_DOWNLOAD_URL=https://releases.mujcode.com/downloads/MUJCODE-Local-Compiler-Setup-1.0.0.exe
  ```
- **Fallback Behavior**: If `VITE_LOCAL_COMPILER_DOWNLOAD_URL` is empty or unset, the widget gracefully displays:
  > *"Windows installer download is currently unavailable. Contact your administrator or build from source."*
  This prevents broken links or misleading downloads.

---

---

## 10. Release Hosting Options & Verification Commands

> **Important**: Do NOT upload, deploy, or publish installers to public hosting without explicit team authorization.

When authorized, choose one of the following production release hosting targets:

### Option A: GitHub Releases (Recommended for Beta)
```bash
# Verify installer existence and hash before publishing
Get-FileHash -Algorithm SHA256 ./release/MUJCODE-Local-Compiler-Setup-1.0.0.exe

# Create GitHub release and upload installer + blockmap
gh release create v1.0.0-beta.1 \
  ./release/MUJCODE-Local-Compiler-Setup-1.0.0.exe \
  ./release/MUJCODE-Local-Compiler-Setup-1.0.0.exe.blockmap \
  --title "MUJCODE Local Compiler v1.0.0 Beta 1" \
  --notes "Initial beta release of the MUJCODE Local Compiler desktop agent." \
  --prerelease

# Verify release download and checksum:
curl -sL https://github.com/<org>/mujcode/releases/download/v1.0.0-beta.1/MUJCODE-Local-Compiler-Setup-1.0.0.exe -o test_download.exe
certutil -hashfile test_download.exe SHA256
```

### Option B: Cloudflare R2 / AWS S3 + Custom CDN
```bash
# Upload to object storage bucket:
aws s3 cp ./release/MUJCODE-Local-Compiler-Setup-1.0.0.exe s3://mujcode-releases/downloads/v1.0.0/ --acl public-read

# Verify public accessibility and content length:
curl -I https://releases.mujcode.com/downloads/v1.0.0/MUJCODE-Local-Compiler-Setup-1.0.0.exe
```

---

## 11. Security Boundaries & In-Depth OS-Level Sandboxing Assessment

### Current Execution Model
The desktop agent uses Node.js `child_process.spawn()` with direct process execution:
- **No Shell Execution**: `shell: true` is strictly prohibited. All commands are passed as discrete token arrays, preventing shell injection vulnerabilities.
- **Process Tree Cleanup**: Infinite loops and stalled processes are terminated via `taskkill /PID <pid> /T /F`.
- **Output Buffering**: Execution output is clamped to 256 KB.
- **Source Size Limits**: Source files are restricted to 100 KB.

### Security Limitation: Lack of OS-Level Sandboxing
> [!WARNING]
> Process execution limits (timeouts, output caps, taskkill) do **NOT** constitute an OS-level security sandbox.
> 
> Code executed locally runs with the **exact security context and privileges of the currently logged-in Windows user**.
> 
> A student's program (or malicious code pasted by a student) has the technical capability to:
> 1. Read, modify, or delete files accessible to that Windows user (e.g., `%USERPROFILE%\Documents`, `%USERPROFILE%\Downloads`).
> 2. Make outbound network connections from the student's machine (subject to Windows Firewall).
> 3. Inspect other non-elevated user processes.

### Assessment for Public Release
For a **controlled beta with trusted internal students**, running with user privileges is acceptable with proper disclosures:
- Students are compiling their own code to practice and debug.
- The desktop agent never executes code sent from other students (peer isolation).
- Authoritative grading (Submit) occurs strictly on the server-side judge.

For a **general public release**, stronger OS-level isolation should be implemented on Windows:
1. **Windows AppContainer Isolation**: Running compilers inside a restricted AppContainer with restricted SID, blocking filesystem access outside the workspace folder and disabling network capability.
2. **Windows Sandbox / Hyper-V Containerization**: Executing student code inside an ephemeral lightweight VM container.
3. **Low-Privilege Dedicated Service Account**: Spawning compiler worker processes under a locked-down local Windows user account without access to student profile directories.
