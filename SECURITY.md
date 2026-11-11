# Security Policy

At **Stockly.ai**, we take the security and integrity of our codebase, user sessions, and real-time market data pipelines seriously. This document outlines our vulnerability disclosure policy and security procedures.

---

## 🛡️ Supported Versions

We actively provide security patches and updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| `main` (Latest) | :white_check_mark: |
| `< 1.0.0`       | :x:                |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in Stockly.ai, please **do not disclose it publicly** through GitHub Issues or social media. Instead, report it privately following the instructions below:

### How to Report:
1. **Email Privately**: Send an encrypted or confidential email to **[anshkunwar3009@gmail.com](mailto:anshkunwar3009@gmail.com)** with the subject line `[SECURITY] Stockly Vulnerability Report`.
2. **Include Details**:
   - Description of the vulnerability and its potential impact.
   - Clear reproduction steps or Proof of Concept (PoC) code.
   - Any suggested remediations or workarounds.

### Response Timeline:
- **Initial Acknowledgment**: Within **48 hours** of submission.
- **Triage & Status Update**: Within **5 business days** confirming the issue and assessing severity.
- **Resolution & Release**: A coordinated fix and security advisory will be published once verified.

---

## 🔒 Security Architecture Highlights

Stockly.ai implements defense-in-depth engineering practices:
- **Zero-Trust Edge Database**: Cloudflare D1 parameterized SQL queries prevent SQL injection attacks.
- **OAuth 2.0 Hardening**: Secure HTTP-only session cookies with `SameSite=Lax`, domain verification, and Google OpenID Connect token signature validation.
- **Rate-Limiting & Caching**: Server-side in-memory caching and edge request batching to protect backend endpoints from abuse and DoS spikes.
- **Automated CI Scanning**: GitHub Actions enforces continuous ESLint rules, TypeScript strict typing, and production build audits on every commit.

Thank you for helping keep Stockly.ai and our community safe!
