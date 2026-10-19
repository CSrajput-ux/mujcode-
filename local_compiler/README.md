# MUJCODE Local Compiler Desktop Agent

An Electron + Node.js + TypeScript desktop agent for Windows that allows students to execute programming code on their local computers directly from the MUJCODE platform.

---

## Architecture Overview

```
local_compiler/
├── docs/
│   └── NETWORKING.md        # Comprehensive networking & pairing protocol specification
├── src/
│   ├── shared/
│   │   ├── agentProtocol.ts     # Protocol messages, pairing challenge, and state schemas
│   │   ├── executionTypes.ts    # ExecutionRequest, ExecutionResult, ToolchainDiagnostic contracts
│   │   └── ipcChannels.ts       # Strictly typed IPC channel constants
│   ├── compiler/
│   │   ├── registry.ts          # Language metadata (IDs 50, 54, 62, 71, 63, 60, 82)
│   │   ├── runner.ts            # Windows-hardened process runner (taskkill process-tree cleanup)
│   │   ├── adapterBridge.ts     # Unified executeCode(req) interface with pre-flight doctor checks
│   │   └── adapters/            # Reused C, C++, Java, Python, JavaScript, Go, and SQL adapters
│   ├── networking/
│   │   ├── agentConfig.ts       # Environment-validated configuration (HTTPS/WSS enforcement)
│   │   ├── agentState.ts        # Finite state machine (DISCONNECTED, CONNECTED, PAIRING_REQUIRED...)
│   │   ├── credentialStorage.ts # Electron safeStorage hardware encryption with fail-closed fallback
│   │   ├── pairingService.ts    # Student-approved single-use 5-minute challenge pairing lifecycle
│   │   ├── jobProtocol.ts       # Strict pre-flight validation, deduplication, and execution dispatch
│   │   ├── agentConnectionService.ts # Connection orchestrator with exponential jitter backoff & heartbeat
│   │   └── transport/
│   │       ├── transportInterface.ts # Pluggable transport contract
│   │       ├── mockTransport.ts      # In-memory deterministic transport for integration tests
│   │       └── socketIoTransport.ts  # Hardened Socket.IO client with strict TLS enforcement
│   ├── services/
│   │   └── runtimeDoctor.ts     # Toolchain PATH discovery & version detector
│   ├── main/
│   │   ├── index.ts             # Electron Main Process entry point & window manager
│   │   └── ipcHandlers.ts       # Validated IPC endpoints (no credentials leaked to renderer)
│   ├── preload/
│   │   └── index.ts             # Context-isolated window.mujcode bridge
│   └── renderer/
│       ├── index.html           # Diagnostic & networking pairing dashboard
│       ├── styles.css           # Dark-mode dashboard theme
│       └── app.ts               # Diagnostic UI controller
└── test/
    ├── compilerBridge.test.ts   # 21 compiler bridge unit & integration tests
    └── agentNetworking.test.ts  # 25 networking, state machine, and pairing tests
```

---

## Language Compatibility & Host Status

| Language | ID | Compiler / Runtime | Host Status on Dev Machine | Execution Method |
| :--- | :---: | :--- | :---: | :--- |
| **C** | `50` | MinGW GCC (`gcc.exe`) | **Available** (`C:\MinGW\bin\gcc.exe`) | Compiles to `out.exe`, direct spawn execution |
| **C++** | `54` | MinGW G++ (`g++.exe`) | **Available** (`C:\MinGW\bin\g++.exe`) | Compiles to `out.exe`, direct spawn execution |
| **Java** | `62` | OpenJDK / Oracle JDK | **Available** (`javac.exe`, `java.exe`) | Compiles `.java`, runs with `-Xms32m -Xmx256m` |
| **Python** | `71` | Python 3.10+ | **Available** (`python.exe` 3.10) | Direct interpreter spawn with `PYTHONUTF8=1` |
| **JavaScript** | `63` | Node.js LTS | **Available** (`node.exe` v24.18) | Spawns with `--max-old-space-size=128` |
| **SQL** | `82` | SQLite WebAssembly (`sql.js`) | **Available** (Built into Desktop App) | In-memory `:memory:` isolated database |
| **Go** | `60` | Golang (`go.exe`) | **Missing** | Gracefully returns `DEPENDENCY_MISSING` |

---

## Runtime Doctor

The **Runtime Doctor** scans the student's Windows `%PATH%` and detects installed compilers:

```bash
# Run standalone diagnosis from command line:
npm run dev:doctor
```

Output:
```json
[
  { "languageId": 50, "runtimeName": "GCC (C Compiler)", "available": true, "detectedVersion": "gcc.exe 6.3.0" },
  { "languageId": 54, "runtimeName": "G++ (C++ Compiler)", "available": true, "detectedVersion": "g++.exe 6.3.0" },
  { "languageId": 62, "runtimeName": "Java Development Kit (JDK 17+)", "available": true, "detectedVersion": "javac 24" },
  { "languageId": 71, "runtimeName": "Python 3 Runtime", "available": true, "detectedVersion": "Python 3.10.11" },
  { "languageId": 63, "runtimeName": "Node.js LTS Runtime", "available": true, "detectedVersion": "v24.18.0" },
  { "languageId": 60, "runtimeName": "Go Compiler (Golang)", "available": false, "troubleshootingInstructions": "Install Go: winget install Golang.Go" },
  { "languageId": 82, "runtimeName": "SQL Engine (Built-in SQLite / WebAssembly)", "available": true, "detectedVersion": "SQLite 3 (Built-in WebAssembly Engine)" }
]
```

---

## Running the Automated Tests

The test suite validates input sanitization, registry resolution, error formatting, output truncation, timeouts, compiler execution, as well as the full networking state machine, exponential backoff, safeStorage credential persistence, device pairing lifecycle, and job protocol validation:

```bash
# Run all 46 unit & integration tests:
npm test

# Or run specific test suites:
node --test test/compilerBridge.test.ts
node --test test/agentNetworking.test.ts
```

See [NETWORKING.md](docs/NETWORKING.md) for full protocol details and backend API specifications.
See [RELEASE_GUIDE.md](docs/RELEASE_GUIDE.md) for Windows packaging, NSIS configuration, code-signing, and release workflows.

---

## Packaging the Windows Installer

Packaging is driven by `electron-builder` and generates an NSIS per-user installer:

```bash
# Build TypeScript and copy UI assets:
npm run build

# Generate unpacked test distribution in release/win-unpacked/:
npm run pack:win

# Generate Windows Setup Installer in release/MUJCODE-Local-Compiler-Setup-1.0.0.exe:
npm run dist:win
```

Installer properties:
- **Installer Artifact**: `release/MUJCODE-Local-Compiler-Setup-1.0.0.exe` (~78 MB)
- **Installer Mode**: Per-user installation (`perMachine: false`, no admin prompt required)
- **Start Menu**: Automatic shortcut `MUJCODE Local Compiler`
- **Exclusions**: Development artifacts, `.env` files, tests, and raw source code are excluded from the packaged ASAR archive.
- **Code Signing**: Prepared for Authenticode signing via `CSC_LINK` / `CSC_KEY_PASSWORD`. Unsigned builds show standard Windows SmartScreen prompt.

---

## Known Windows & Security Limitations

1. **Child Process Privileges:**
   Child processes run with the permissions of the current Windows user account. Ordinary process spawning does **not** provide a kernel-level sandbox. Arbitrary code submitted by untrusted third parties should not be executed without OS virtualization.
2. **Process Tree Termination on Windows:**
   On Windows, standard `child.kill('SIGTERM')` does not kill subprocesses spawned by student code. The runner implements a `taskkill /PID <pid> /T /F` fallback to terminate process trees upon timeout.
3. **Electron Binary vs. Node.js:**
   When running packaged in Electron, `process.execPath` refers to the Electron desktop executable. The JavaScript adapter resolves the system `node.exe` or sets `ELECTRON_RUN_AS_NODE: '1'` to prevent spawning secondary GUI windows.

---

## Troubleshooting Missing Dependencies

- **GCC / G++:** Run `winget install MSYS2.MSYS2` or download from [winlibs.com](https://winlibs.com).
- **Java JDK:** Run `winget install Oracle.JDK.17` or `winget install EclipseAdoptium.Temurin.17.JDK`.
- **Python:** Run `winget install Python.Python.3.11`.
- **Go:** Run `winget install Golang.Go`.
