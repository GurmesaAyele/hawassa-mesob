# VIP tickets and Staff role integration guide

This guide is the proposed handoff for implementing the VIP ticket workflow across the server, admin dashboard, and public VIP client. It describes compatibility requirements; it does not itself change server or client behavior.

## Current project behavior to preserve

- The public VIP client submits applications to `POST /api/vip-tickets`. It sends applicant details and service IDs and expects the created ticket reference at `data.reference`. Payment initialization and payment-status checking use that reference.
- The server already has VIP application, public tracking, payment, and queue routes under `/api/vip-tickets` and `/api/vip-payments`.
- The existing `GET /api/vip-tickets` list accepts filters and returns masked applicant information, but it is on the public VIP router. Do not rely on it as the Staff dashboard endpoint or expand its PII response for this purpose.
- The database `vip_tickets.status` uses the queue/payment-related `TicketStatus` lifecycle (`PENDING`, `CONFIRMED`, `QUEUED`, `SERVING`, `USED`, `CANCELLED`). It is not the same as staff service-processing status.
- The admin dashboard currently has `SUPER_ADMIN`, `OPERATOR`, and a frontend-only `STAFF` view. Staff users are routed to VIP tickets and other sections are hidden, but the current server role enum and authentication allowlists do not yet accept `STAFF`.
- The dashboard VIP view currently uses demo records. It expects a reference, a person name, a service label, an issue date, and one of three service statuses.

Preserve the public application, tracking, queue, and payment contracts while adding this separate staff workflow.

## Recommended architecture

Use the existing VIP ticket records as the source of truth. Add a distinct staff-processing lifecycle rather than overloading the existing ticket queue status or payment status.

Recommended internal field:

```text
serviceProcessingStatus: PENDING | IN_PROGRESS | COMPLETED
```

Default new applications to `PENDING`. Keep the existing fields and their meanings unchanged:

- `vip_tickets.status`: existing ticket/payment/queue lifecycle.
- payment record status: payment outcome.
- `serviceProcessingStatus`: work progress by MESOB staff.

If the business rule is that only paid or otherwise confirmed tickets can be handled, implement that as an explicit eligibility rule. Do not infer completion or progress from payment or queue state.

## Server-side recommendations

### 1. Add and migrate the Staff role

The current `UserRole` enum includes `CITIZEN`, `OPERATOR`, and `SUPER_ADMIN`. Add `STAFF` through the repository's normal Prisma migration workflow. Update every server role allowlist involved in:

- login eligibility;
- `authenticateAdmin` session validation;
- `/api/auth/me` response/session handling, if role-specific logic is present;
- user provisioning and role validation.

Do not allow public registration to assign `STAFF`. Create Staff accounts through an authorized administrator or a controlled provisioning process. Keep account activation/deactivation behavior and password/session protections consistent with other admin accounts.

### 2. Enforce least privilege on the server

The frontend hiding tabs is only a usability measure; all authorization must be enforced by the API on every request.

Suggested role matrix:

| Capability | SUPER_ADMIN | OPERATOR | STAFF |
|---|---:|---:|---:|
| Sign in to admin dashboard | Yes | Yes | Yes |
| Read VIP work list | Yes | Yes, if part of operator duties | Yes |
| Change VIP service-processing status | Yes | Only if explicitly authorized | Yes, if required by the workflow |
| Manage institutions, services, home content, or site settings | Existing policy | Existing policy | No |
| Read or update citizen contact inbox | Existing policy | Existing policy | No |
| Manage users/roles | Existing policy | No unless already explicitly allowed | No |

Use the existing `authenticateAdmin` and `requireRole` middleware patterns. Add protected routes to an admin-only router, for example `GET /api/admin/vip-tickets`, rather than putting privileged applicant data on the public `/api/vip-tickets` router. Check authorization for list and update endpoints separately. Never trust a role, status, or user ID supplied by the browser.

### 3. Add a dedicated admin list endpoint

Recommended endpoint:

```http
GET /api/admin/vip-tickets?page=1&limit=25&status=pending
Cookie: existing admin session
```

Suggested response:

```json
{
  "data": [
    {
      "id": "ticket-id",
      "reference": "VIP-2026-001",
      "person": "Applicant display name",
      "service": "Business license support",
      "issuedAt": "2026-11-04T09:30:00.000Z",
      "status": "pending"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 25,
    "statusCounts": {
      "pending": 1,
      "in-progress": 0,
      "completed": 0
    }
  }
}
```

Contract details:

- Map `reference` from the existing ticket code and `issuedAt` from the ticket creation timestamp.
- Map `status` from `serviceProcessingStatus`, serialized as lowercase `pending`, `in-progress`, or `completed`. Do not map from `vip_tickets.status` or payment status.
- Validate `status`, `page`, and `limit`; cap the page size and return a clear `400` for invalid query values.
- Return stable ordering (for example newest first, then ID as a tie-breaker), ISO 8601 timestamps, a total for the selected filter, and status counts that remain useful across pages.
- The current VIP form can select multiple services. Decide whether the response `service` is a joined display label or change the contract/UI to use `services: [{ id, name }]`. Keep the chosen shape consistent and do not silently omit additional requested services.
- Return only fields needed for staff work. Do not include full email, phone, payment metadata, QR data, or other sensitive fields unless the workflow specifically requires them and the access policy permits them. If a phone/contact field is necessary, agree on it explicitly and protect the endpoint accordingly.
- Return consistent JSON errors: `401` unauthenticated, `403` authenticated but disallowed, `400` invalid query/body, `404` missing ticket, and `500` unexpected server failure. Do not return stack traces or database records.

### 4. Add status updates only with an agreed workflow

The current dashboard is read-only. If Staff must advance tickets, add a separate endpoint, for example:

```http
PATCH /api/admin/vip-tickets/:id/service-status
Content-Type: application/json
Cookie: existing admin session

{ "status": "in-progress" }
```

Before enabling it, agree which roles may update status and which transitions are valid. A reasonable initial transition policy is `PENDING -> IN_PROGRESS -> COMPLETED`, with a Super Admin correction path if needed. Validate transitions server-side, set timestamps on the server, and record the acting user and time in an audit history. Make updates atomic and ensure duplicate/retried requests do not create inconsistent history. Do not add status-edit controls to the dashboard until this endpoint and policy are implemented.

### 5. Migration and compatibility

- Add a separate Prisma enum/field (or equivalent migration) for service-processing status; do not change the meaning of the existing `TicketStatus` enum.
- Backfill existing tickets to a documented initial value. `PENDING` is the proposed value; confirm whether old cancelled, already-served, or completed records need special mapping based on trustworthy existing data.
- Ensure all new ticket-creation paths set the new field via a database default or application code.
- Use a normal reviewed Prisma migration and test it against a copy/staging database before production. Do not drop or rewrite existing queue/payment fields.
- Deploy server support before enabling the dashboard to depend on the new endpoint. During rollout, existing public client versions should continue to work unchanged.

## Admin dashboard recommendations

When the server contract is available:

1. Add a `listVipTickets` method to `frontend/src/services/adminApi.js` using its existing request helper, which includes session cookies and handles unauthorized sessions consistently.
2. Replace `DEMO_TICKETS` in `frontend/src/components/admin/VipTicketsManager.jsx` with API data; remove the demo-data notice only after integration.
3. Add explicit loading, error, empty, retry, and pagination states. Keep filter totals consistent with the server metadata.
4. For `STAFF`, fetch only the VIP endpoint. Do not call institution, service, messages, homepage, or site-settings endpoints. Keep non-VIP sections hidden, and do not treat hidden navigation as security.
5. If status updates are approved, display controls only to roles allowed by the server policy and refresh the row/counts after a successful update. Show API errors rather than optimistically claiming a failed update succeeded.
6. Avoid browser storage for applicant PII or authentication tokens; continue using the existing secure admin session.

## Public VIP client compatibility

The public VIP client does not need Staff login features. Keep its application and payment requests/responses backward-compatible:

- Continue accepting its current application fields and return `data.reference` on successful creation.
- Preserve payment initialization and payment status contracts that use that reference.
- Keep public tracking responses limited to the applicant's own ticket and existing masked data. Never make the admin list or full applicant names available through a public endpoint.
- If adding `serviceProcessingStatus` to a public response, make it additive and safe for older clients to ignore; do not replace or reinterpret the existing `status` field.
- Make sure the new admin workflow does not cause public tracking, payment callbacks, queue reservation, queue position, or enqueue behavior to change.

## Suggested implementation order

1. Agree on which tickets Staff should see, required applicant fields, whether Staff can change status, and allowed transitions.
2. Add the Staff role and service-processing status migration; provision test accounts safely.
3. Implement and protect the admin list endpoint and tests.
4. If approved, implement the status-update endpoint and audit trail.
5. Add frontend API integration and replace demo data; retain public client behavior.
6. Test end-to-end in staging, then deploy server before enabling the frontend API dependency.

## Acceptance and regression checks

### Authentication and authorization

- Existing Super Admin and Operator login continues to work.
- Active Staff accounts can sign in and `/api/auth/me` returns `role: "STAFF"`; inactive accounts cannot access the API.
- Unauthenticated requests receive `401`; an authenticated role without permission receives `403`.
- Staff can access only the explicitly permitted VIP routes and are denied by every unrelated admin endpoint, even when called directly outside the dashboard UI.
- Public registration cannot create a Staff or other privileged account.

### VIP API and workflow

- The admin list returns correct references, applicant display names, all requested service labels, timestamps, and service-processing statuses.
- Filtering, stable pagination, totals, and status counts work for empty and large result sets.
- Payment status and existing queue/ticket status remain independent of service-processing status.
- If updates are enabled, allowed transitions succeed, invalid transitions fail, unauthorized roles are denied, and audit history identifies the actor and timestamp.
- Sensitive fields are excluded unless explicitly required and authorized.

### Public and frontend regression

- Existing public application creation still returns `data.reference`; payment and ticket tracking still work.
- Existing queue operations and public tracking retain their current semantics and response fields.
- Staff lands on the VIP ticket view, sees useful loading/error/empty states, and triggers no unrelated admin data requests.
- Super Admin and Operator retain their existing dashboard navigation and behavior.
