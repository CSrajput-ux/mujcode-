# 03 — Language Compatibility & Runtime Verification
**MujCode Platform — Programming Language Runtime Matrix (Judge0 CE v1.13.1)**

---

## 1. Verified Language Catalog

| Language | Judge0 Language ID | Runtime / Compiler | Aliases Supported | Ubuntu VPS Status | Windows WSL2 Status |
|---|---|---|---|---|---|
| **Python** | **71** | Python 3.8.1 | `python`, `python3`, `py`, `py3` | **PASS (100%)** | **PASS (100%)** |
| **C** | **50** | GCC 9.2.0 | `c`, `c_gcc9` | **PASS (100%)** | **PASS (100%)** |
| **C++** | **54** | GCC 9.2.0 | `cpp`, `c++`, `cplusplus` | **PASS (100%)** | **PASS (100%)** |
| **Java** | **62** | OpenJDK 13.0.1 | `java`, `java13` | **PASS (100%)** | Skipped (cgroups v2 address-space) |
| **JavaScript** | **63** | Node.js 12.14.0 | `javascript`, `js`, `node`, `nodejs` | **PASS (100%)** | Skipped (cgroups v2 V8 memory) |
| **Go** | **60** | Go 1.13.5 | `go`, `golang`, `go113` | **PASS (100%)** | Skipped (cgroups v2 thread limits) |
| **SQL** | **Native** | Node.js `node:sqlite` In-Memory | `sql`, `sqlite`, `sqlite3` | **PASS (100%)** | **PASS (100%)** |
| **Rust** | **73** | Rust 1.40.0 | `rust`, `rs` | **PASS (100%)** | Ready |
| **C#** | **51** | Mono 6.6.0.161 | `csharp`, `c#`, `cs` | **PASS (100%)** | Ready |
| **Ruby** | **72** | Ruby 2.7.0 | `ruby`, `rb` | **PASS (100%)** | Ready |
| **Bash** | **46** | Bash 5.0.0 | `bash`, `sh` | **PASS (100%)** | Ready |

---

## 2. Test Execution Verification

- **Unicode I/O:** Verified support for multi-byte Unicode strings (`こんにちは`, `नमस्ते`) in stdin and stdout without mangling via Base64 encoding.
- **Empty Stdin:** Handled gracefully without execution crash or timeout.
- **Syntax / Compilation Errors:** Properly normalized to `COMPILATION_ERROR` with full compiler diagnostic output displayed in user console.
