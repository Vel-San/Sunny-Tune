# Security Policy

## Supported Versions

| Version         | Security fixes        |
| --------------- | --------------------- |
| Latest (`main`) | ✅ Yes                |
| Older branches  | ❌ No — please update |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in SunnyTune, please disclose it responsibly:

1. **Email** the maintainer directly (see the GitHub profile linked in this repo).
2. **Or** use [GitHub Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) if enabled on this repo.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept (do not include actual exploit code targeting real users)
- The affected component(s) and version/commit

You'll receive an acknowledgement within **72 hours** and a resolution timeline within **7 days**.

We follow a **90-day disclosure policy** — if a fix isn't published within 90 days of your report we support your right to disclose publicly.

---

## Security Architecture

### Authentication

- Clients use **anonymous UUID bearer tokens** (`sp_<uuid>`), stored in `localStorage`.
- Tokens are validated against the database on every request — no JWT signing, no stateless tokens.
- Tokens can be **revoked** at any time from the UI (header → key icon → Regenerate token).
- Auth middleware strips the token on any error **only if the server explicitly returns 401** — network errors during a server restart will not silently re-register a new user.

### Admin Panel

- Protected by `ADMIN_SECRET_HASH` (bcrypt, cost 12) — never stored or echoed in plaintext.
- `crypto.timingSafeEqual` prevents timing attacks on secret comparison.
- Rate-limited: 10 requests/minute per IP on all `/api/admin/*` routes.
- Optional IP allowlist (`ADMIN_ALLOWED_IPS`) restricts access to specific addresses.
- Admin secret is stored only in `sessionStorage` in the browser (cleared on tab close).

### Input Validation

- All JSON request bodies validated with **Zod** before reaching handler logic.
- All query parameters (`page`, `limit`, `sort`, etc.) coerced and range-checked.
- Free-text fields have C0/C1 control characters stripped before storage.
- The `config` JSON field rejects unknown top-level section keys.

### Transport & Headers

- **API (Helmet)**: `default-src 'none'; frame-ancestors 'none'` — no mixed content possible.
- **Frontend (nginx)**: Full CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- CORS locked to the configured `CORS_ORIGIN` — no wildcard in production.

### Rate Limiting

- General API: 100 requests/15 min per IP.
- Auth endpoints: 20 requests/15 min per IP.
- Admin endpoints: 10 requests/min per IP.

---

## Bug Bounty

There is currently no formal bug bounty programme. However, responsible disclosures that lead to a fix will be credited in the release notes (with your permission).
