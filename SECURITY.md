# Security Policy

## Reporting Security Vulnerabilities

We take the security and privacy of MujCode, our students, faculty, and partner companies seriously. If you identify a security vulnerability in this repository or the deployed platform, please report it immediately.

**DO NOT file public GitHub issues for security vulnerabilities.**

### How to Report

Please submit security reports directly to:
- **Email**: `security@mujcode.com`
- **Alternative**: Open a Private Vulnerability Advisory via the [GitHub Security Advisory Tab](https://github.com/CSrajput-ux/mujcode-/security/advisories/new)

### What to Include

To help us triage and remediate the vulnerability swiftly, please include:
1. **Description**: Clear summary of the issue (e.g. Authentication Bypass, IDOR, SSRF, Sandbox Escape).
2. **Affected Component**: File path, API endpoint, or service component (e.g. `/api/compile/test`, `Judge0Service.js`).
3. **Reproduction Steps**: Step-by-step instructions or non-destructive conceptual HTTP requests illustrating the issue.
4. **Impact**: Potential consequences if exploited (e.g., student PII leak, grade modification).
5. **Mitigation/Patch** (Optional): Suggested remediations.

### Response Timelines

- **Initial Acknowledgment**: Within 24 hours.
- **Triage & Severity Assessment**: Within 72 hours.
- **Remediation & Patch Deployment**: Critical issues patched within 7 days; High issues within 14 days.

---

## Safe Harbor Policy

We consider security research conducted in good faith to be authorized. We will not pursue legal action against researchers who:
- Give us reasonable time to investigate and fix an issue before public disclosure.
- Make a good-faith effort not to disrupt production services or degrade user experience.
- Do not access, modify, delete, or harvest data belonging to other students, faculty, or organizations.
- Test only against accounts you own or with explicit written consent from the account holder.

---

## Scope

### In-Scope:
- API routes, session management, and authentication (`/api/auth/*`, `/api/student/*`, `/api/faculty/*`, `/api/placements/*`).
- Role-Based Access Control (RBAC) and object-level authorization (IDOR).
- Code execution sandbox isolation and rate limiting (`Judge0 CE`).
- Database injection (SQL/NoSQL) and Prototype Pollution.
- Infrastructure configurations (Docker Compose, Helm, Terraform, GitHub Actions).

### Out-of-Scope:
- Denial of Service (DoS/DDoS) attacks against production infrastructure.
- Social engineering, phishing, or physical attacks on university staff or students.
- Issues related to third-party services (e.g. AWS or Render infrastructure outages) without platform-level vulnerability.
