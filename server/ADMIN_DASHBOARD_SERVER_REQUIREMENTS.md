# Admin Dashboard: Server-Side Implementation Requirements

This brief defines the server work needed to safely support the frontend admin dashboard. It is an implementation handoff, not a claim that the requirements are already implemented. The dashboard must not be exposed for production use until authentication and authorization protect every administrative read and write.

## 1. Authentication and authorization

- Implement sign-in, sign-out, and current-session endpoints, for example:
  - `POST /api/auth/login` — validate credentials and establish an authenticated session.
  - `POST /api/auth/logout` — invalidate the session.
  - `GET /api/auth/me` — return the authenticated user's safe public profile and roles.
- Use the existing `users` model and `UserRole` values (`CITIZEN`, `OPERATOR`, `SUPER_ADMIN`). Only active `OPERATOR` and `SUPER_ADMIN` accounts may enter the dashboard. Define and enforce which role can perform each operation; institution, service, content, and site-setting changes should require `SUPER_ADMIN`.
- Store passwords only as a modern, salted, slow password hash (for example Argon2id or scrypt). Never return hashes or secrets. Avoid revealing whether an email address exists in sign-in errors.
- Prefer server-managed sessions or short-lived signed tokens in `HttpOnly`, `Secure` (in production), appropriately `SameSite` cookies. Keep signing keys in environment configuration, require strong random values, and document key rotation and session invalidation.
- Protect cookie-authenticated mutations against CSRF (for example, strict origin checking plus a CSRF token or another documented, tested defense). Do not rely on a frontend-only check or a caller-supplied header as authorization.
- Rate-limit sign-in attempts, validate and normalize inputs, and log security-relevant events without logging passwords, tokens, or session cookies.
- Provide a documented, safe way to provision the first super-admin (operator-run CLI or controlled bootstrap). Do not ship default credentials, public registration for privileged roles, or a seed password.
- Reject unauthenticated requests with `401`, authenticated users lacking permission with `403`, and return consistent, non-sensitive JSON error shapes.

## 2. Protect the dashboard API

Apply authentication and role checks in the server routing/controller layer to **all administrative reads and mutations**, including legacy aliases. Public reads and public contact-message submission must continue to work without an admin session.

| Area | Dashboard operations | Required access |
|---|---|---|
| Institutions | List including inactive records; create, update, deactivate, permanent delete | Authenticated admin reads; `SUPER_ADMIN` mutations |
| Services | List including inactive records; create, update, deactivate | Authenticated admin reads; `SUPER_ADMIN` mutations |
| Contact inbox | List messages and unread count; mark read/unread | `OPERATOR` or `SUPER_ADMIN` |
| Home content | List, create, update, delete news, announcements, and videos | Authenticated admin reads; `SUPER_ADMIN` mutations |
| Location/contact settings | Read and update map/location/contact settings | Authenticated admin reads; `SUPER_ADMIN` mutations |
| Public contact form | Submit a message | Public, with validation and abuse controls |

Protect aliases such as `/api/messages` and `/api/location` to the same standard as their canonical endpoints. Keep public routes deliberately separate from admin routes so adding a dashboard feature cannot accidentally expose a write endpoint.

## 3. API contract required by the frontend

Keep the existing frontend payload conventions or version/document any deliberate changes. The dashboard's client currently expects:

- List endpoints for institutions, services, news, announcements, and videos to accept `raw=true`, `includeInactive=true`, and `limit=50`, returning `{ "data": [...] }`.
- The contact inbox to return `{ "data": [...], "meta": { "unreadCount": number } }`; support filtering by read status and a mutation to mark a message read/unread.
- Institution and service create/update endpoints to accept localized values (`en`, `am`, `sid`) and preserve existing public response shapes.
- News and announcement create/update/delete endpoints, including localized title/content and the fields represented by the admin forms.
- Video create/update/delete endpoints that validate supported YouTube URLs and localized metadata.
- A site-settings read/write endpoint with validated contact details, map coordinates, and business hours. Avoid silently replacing omitted settings during partial updates.
- Consistent status codes and JSON errors for validation, missing records, conflicts, permission failures, and server failures.
- Explicit limits/pagination and stable ordering for large collections; do not make `limit=50` silently truncate data without a way to request subsequent pages.

Coordinate any backend contract changes with the client developer and update the API integration guide and automated tests.

## 4. Institution logo uploads

- Define the accepted upload field name, response property, maximum file size, and allowed image formats for the client.
- Validate file content by signature as well as declared MIME type and reject malformed, oversized, or non-image files.
- Generate safe storage names; never trust a user-supplied filename or path.
- Store uploads in durable production storage (object storage or an equivalent managed service), not an ephemeral application filesystem. Return a public HTTPS URL or a documented asset identifier.
- Replace/delete old assets safely and clean up an upload if its database write fails. Do not remove an asset still referenced by another record.
- Enforce upload authorization, rate/size limits, and safe response headers. Document local development storage separately from production storage.

## 5. Configuration, operations, and rollout

- Document required environment variables, secure production cookie/origin settings, CORS credentials configuration, and secret generation/rotation.
- Add database migrations for any schema changes; do not depend on an undocumented manual schema push in production.
- Provide an operator runbook for creating/deactivating admin accounts, resetting credentials, revoking sessions, and restoring access.
- Ensure health checks do not expose secrets or sensitive account information.
- Before enabling the dashboard in production, verify all administrative endpoints deny anonymous access and role violations, while public institution/service/content reads and public contact submission retain their intended behavior.

## 6. Required automated tests

- Login success, invalid credentials, inactive users, non-admin users, logout, session expiry/tampering, and credential/session revocation.
- `401` on every admin endpoint without a session and `403` for insufficient roles, covering canonical and legacy paths.
- `OPERATOR` inbox access and denial of `OPERATOR` access to super-admin mutations.
- Public-read and public-contact-submission regression tests.
- Validation, pagination, status transitions, and error response shapes for each dashboard module.
- Logo upload format/size/content validation, storage failure, and database failure cleanup.
- Configuration checks that fail safely when production authentication or storage secrets are absent.

## Readiness gate

Do not consider the admin dashboard production-ready until the route-protection matrix and tests above pass, a privileged account is provisioned securely, and deployment configuration/storage have been verified.
