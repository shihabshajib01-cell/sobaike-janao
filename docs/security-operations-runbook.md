# Sobaike Janao Security Operations Runbook

Last updated: 25 September 2026

## Purpose

This runbook covers operational actions that sit outside normal UI/product work. It complements the automated application security controls; it does not replace them.

## 1. Release security gate

A production release is acceptable only when the exact revision passes:

- dependency/tree validation and vulnerability audit;
- full Git-history secret audit;
- evidence metadata sanitization audit;
- security-hardening audit;
- integration/design-system/accessibility checks;
- production build;
- Public → SQL → Admin sync smoke;
- public payload privacy and anonymous-RPC smoke;
- live Bangladesh map mobile/desktop smoke;
- Public browser, UI, form, composer, and WCAG regression.

Do not bypass a failed gate to publish an unrelated feature.

## 2. Security incident response

When a credible security incident is reported or detected:

1. Record the time, affected surface, evidence, and reporter contact only when voluntarily supplied.
2. Do not publish sensitive exploit details, credentials, reporter evidence, precise location, or private database data in a public issue.
3. Determine whether the incident involves public content, Admin authorization, Auth/session compromise, database/RLS, Storage/evidence, Edge Functions, DNS/domain, or third-party infrastructure.
4. Preserve relevant logs and audit records before changing the affected system.
5. Contain the smallest affected surface. Revoke compromised sessions/keys before broader product changes.
6. For Admin compromise, disable the affected Admin account/session and rotate any exposed credential.
7. For public-write abuse, keep the gateway fail-closed and adjust server/database limits rather than trusting client checks.
8. For private-data exposure, stop the exposure first, then identify the affected records and time window.
9. Fix the root cause and run the complete release security gate above.
10. Document the incident, remediation, regression test, and any notification decision in a restricted operational record.

Public reporting contact: https://shobaikejanao.com/.well-known/security.txt

## 3. Reporter-data minimization

- Public payloads must never expose reporter contact data, PIN hashes, rejection notes, private submission context, visitor/session identifiers, or precise reporter GPS.
- Browse sessions must not persist precise device coordinates.
- Precise device GPS captured for report submission is private.
- Precise submission telemetry is scrubbed after moderation, or by the automated maximum-retention job if moderation has not completed.
- Access to precise reporter GPS is restricted to an active Super Admin with AAL2 and a valid live Supabase session.
- Evidence remains in the private complaint-evidence bucket and is served only through the controlled policy/signed-access flow.

Any change to these rules requires a privacy/security review before deployment.

## 4. Backups and restore

The current Supabase organization is on the Free plan. Supabase's current backup documentation recommends Free projects perform regular logical exports and maintain off-site backups.

Required operational practice:

- keep production backup files outside this public repository and outside normal GitHub Actions artifacts;
- use an encrypted, access-controlled off-site destination;
- never store service-role/database credentials inside backup files or documentation;
- define backup frequency based on acceptable data-loss risk;
- periodically perform a restore test into an isolated non-production environment;
- record backup timestamp, integrity check, restore-test result, and owner;
- remember that database backups do not restore deleted Storage object bytes automatically; private evidence/storage requires a separate protected backup/retention decision.

A backup is not considered verified until a restore test succeeds.

## 5. Domain / DNS / edge

Account owner must verify at the registrar/edge provider:

- MFA is enabled;
- domain/transfer lock is enabled;
- recovery email/phone and authorized administrators are current;
- DNS changes are restricted to authorized operators;
- if an edge/CDN is introduced, enable response-level HSTS, CSP frame-ancestors 'none', nosniff, Permissions-Policy, Referrer-Policy, WAF/bot controls, and provider DDoS protection.

GitHub Pages application code cannot by itself provide all of these response-level controls.

## 6. Auth plan limitation

Supabase Security Advisor currently reports compromised/leaked-password checking as unavailable on the current Free plan.

Existing compensating controls must remain:

- live auth.sessions validation for Admin authorization;
- AAL2 for sensitive Admin operations;
- server-side role/permission checks;
- inactive/revoked sessions fail closed.

When the organization moves to a plan supporting leaked-password protection, enable it and re-run the Auth security audit.

## 7. Monitoring

- Production Smoke runs after successful deployments and on its recurring schedule.
- SEO freshness monitoring remains separate from security monitoring.
- Failed production security smoke must be treated as a release/operations alert and investigated before further deployment.
- Do not silence a failing smoke test by weakening its assertion unless the product/security contract has intentionally changed and the replacement test protects the same boundary.

## 8. External closeout

Infrastructure/account actions that cannot be completed from application code are tracked in GitHub issue #302. Close that issue only after evidence exists for the registrar, edge/CDN, Auth-plan, and backup/restore controls.
