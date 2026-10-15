# MujCode Security Scanning Policy & CI Pipeline Reference

**Document Version:** 1.0.0  
**Effective Date:** October 15, 2026  
**Applies To:** `CSrajput-ux/mujcode-` (All branches, pull requests, container images)

---

## 1. Automated Security Tooling Matrix

| Tool / Scanner | Inspection Layer | Execution Trigger | Severity Threshold | Enforcement Action | Owner |
|---|---|---|---|---|---|
| **Gitleaks** | Git commit history, staged diffs | Pull Request, Push to `main` | Any leaked secret pattern | **Fail Closed (Blocks Build)** | DevSecOps Lead |
| **npm audit** | Direct & transitive npm dependencies | CI `test` stage, Weekly schedule | High, Critical (`--audit-level=high`) | Advisory Warning / Block on High | Backend & Frontend Leads |
| **GitHub CodeQL** | AST & Semantic SAST analysis (JS/TS) | Push to `main`, Pull Request, Weekly | High, Critical (CWE/OWASP Top 10) | Pull Request Check Failure | Lead Security Architect |
| **Trivy Container Scan** | Docker images (Backend, Frontend, Judge0) | Image build stage in CI/CD | Critical CVEs, OS packages | Block ECR Push on Critical | Platform Engineer |
| **Terraform tfsec / Checkov** | IaC templates (`terraform/`) | PR modifying IaC files | High, Critical (Security Group, S3, RDS) | Block PR Merge | DevOps Lead |

---

## 2. Scan Triggers and Execution Details

### 2.1 Secret Scanning (Gitleaks)
- **Workflow File:** `.github/workflows/ci-cd.yml`
- **Scope:** Complete git commit tree using `fetch-depth: 0`.
- **Target Patterns:** AWS Access Keys, GitHub PATs, JWT Secret Keys, Database Passwords, Private Keys (`-----BEGIN PRIVATE KEY-----`).
- **Policy:** Zero tolerance. If any credential is detected in code or git history, the job fails immediately.

### 2.2 Dependency Vulnerability Management (npm audit)
- **Scope:** `backend/package.json` and `frontend/package.json`.
- **Command:** `npm audit --audit-level=high`
- **Deterministic Installs:** CI strictly executes `npm ci` to adhere to `package-lock.json`. Ad-hoc `npm install` is prohibited in CI.

### 2.3 Static Application Security Testing (CodeQL)
- **Workflow File:** `.github/workflows/codeql.yml`
- **Languages:** JavaScript, TypeScript (`javascript-typescript`).
- **Queries:** `security-extended`, covering SQL Injection, NoSQL Injection, Prototype Pollution, Insecure Deserialization, SSRF, Cross-Site Scripting (XSS), and Unsafe Deserialization.

### 2.4 Container Image Security (Trivy)
- **Scope:** `backend/Dockerfile`, `frontend/Dockerfile`, `judge0/docker-compose.yml`.
- **Action:** Scans base Alpine/Ubuntu distributions for unpatched CVEs before pushing to Amazon ECR or deploying to production.

---

## 3. Vulnerability Remediation Timeline (SLA)

| Severity | Description | Remediation SLA | Escalation Target |
|---|---|---|---|
| **Critical (CVSS 9.0–10.0)** | Remotely exploitable RCE, Auth Bypass, SQLi, Hardcoded Root Secret | **24 Hours** | Lead Architect & CTO |
| **High (CVSS 7.0–8.9)** | Privilege escalation, IDOR, sensitive data leakage, High DoS | **72 Hours** | Engineering Manager |
| **Medium (CVSS 4.0–6.9)** | Non-sensitive information disclosure, CSRF without state mutation | **14 Days** | Tech Lead |
| **Low (CVSS 0.1–3.9)** | Security header misconfiguration, informational banner leakage | **30 Days** | Assigned Developer |

---

## 4. Exception & Waiver Process

1. **Submission:** If a vulnerability cannot be resolved immediately (e.g. upstream dependency has no released fix), the engineer must submit a Security Exception Request.
2. **Required Information:**
   - CVE Identifier & CVSS Score
   - Affected Package and File Path
   - Compensating Controls (e.g., input sanitization, network policy isolation)
   - Estimated Date of Upstream Fix
3. **Approval:** Requires formal written sign-off from both the **Lead Security Architect** and **DevSecOps Lead**.
4. **Expiration:** Exceptions expire automatically after **30 days** and must be re-evaluated.
