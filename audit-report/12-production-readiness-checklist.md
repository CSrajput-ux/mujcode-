# 12 — Production Readiness Checklist
**MujCode Platform**

---

## Security Checklist

- [ ] P0: CORS_ORIGIN set to exact Vercel domain (not *)
- [ ] P0: Frontend @tiptap/* upgraded to >=3.30.4
- [ ] P0: judge0.conf passwords moved to Docker secrets/env
- [ ] P1: IDOR audit complete on all user-data endpoints
- [ ] P1: HttpOnly cookie flag confirmed for JWT storage
- [ ] P1: Content-Security-Policy added to frontend nginx.conf
- [ ] P1: /metrics endpoint protected or IP-restricted
- [ ] P2: npm audit fix run on frontend (moderate vulns resolved)

## Database & Backup Checklist

- [ ] P0: Database backup procedure implemented (pg_dump or Neon PITR)
- [ ] P0: Backup restoration tested (restore to disposable DB, verify counts)
- [ ] P0: Backup monitoring/alerting configured
- [ ] P1: PostgreSQL pool max increased to 10-15
- [ ] P1: DB fallback emits CRITICAL log alert
- [ ] P2: MongoDB Atlas backup enabled for ATS module

## Compiler / Judge0 Checklist

- [ ] P0: Judge0 deployed on Ubuntu VPS (not Windows WSL2)
- [ ] P0: cgroups v1 enabled on Ubuntu server (GRUB config)
- [ ] P1: All 7 languages verified: C, C++, Python, JavaScript, Java, Go, SQL
- [ ] P1: JUDGE0_URL updated in .env to production URL
- [ ] P1: Judge0 port 2358 NOT publicly exposed (verified in firewall)

## Infrastructure Checklist

- [ ] Docker images built and tested
- [ ] nginx.conf verified for correct upstream configuration
- [ ] Redis deployed (Upstash or container) with persistence enabled
- [ ] PostgreSQL external URI confirmed (Neon.tech production project)
- [ ] Cloudinary credentials configured and tested
- [ ] MongoDB Atlas URI configured (if ATS module needed)
- [ ] SSL/TLS certificate issued for domain
- [ ] DNS configured to point to server

## Environment Checklist

- [ ] NODE_ENV=production in all production .env
- [ ] TOKEN_SECRET is 32+ random bytes (not default)
- [ ] .env is NOT committed to git (verify with git log --all -- .env)
- [ ] POSTGRES_PASSWORD is strong (not default "postgres")
- [ ] WEB_CONCURRENCY=4 (or appropriate for server CPU count)
- [ ] POSTGRES_POOL_MAX=10 (increased from default 5)

## Performance Checklist

- [ ] Load test run on production server (not Windows dev machine)
- [ ] Peak RPS measured under realistic authenticated traffic
- [ ] p99 latency < 500ms at expected peak concurrency
- [ ] Error rate < 1% under normal load (excluding intentional rate limits)

## Operations Checklist

- [ ] Logging to persistent storage or log aggregation (not just stdout)
- [ ] Prometheus metrics accessible for monitoring
- [ ] Health check endpoints responding: GET / → 200
- [ ] Graceful shutdown tested (SIGTERM → in-flight requests complete)
- [ ] Alert rules configured for critical metrics
- [ ] Incident response runbook documented

## Testing Checklist

- [ ] Backend test suite passes: 30/33+ tests PASS
- [ ] Frontend build succeeds: npm run build exits 0
- [ ] TypeScript type check passes: npm run typecheck
- [ ] All 7 compiler languages verified on target OS
- [ ] Login/logout flow manually tested
- [ ] Code submission flow manually tested
- [ ] File upload/download manually tested

---

## Final Sign-Off Conditions

The application is ready for production ONLY when:
1. All P0 issues resolved
2. All P1 security issues resolved
3. Backup procedure verified with successful restore
4. All 7 compiler languages tested on target OS (Ubuntu)
5. Load test on production server shows acceptable p99 latency
6. Final npm audit shows 0 HIGH vulnerabilities
