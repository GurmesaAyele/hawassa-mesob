# VIP ticket admin integration recommendation

This is an integration proposal for the server and public-client contributors. The admin dashboard currently displays demo rows only; it does not fetch or update VIP tickets. No server or public-client changes are included here.

## Current project context

- The public VIP flow submits an application to `POST /api/vip-tickets` and expects a created ticket reference at `data.reference`. Keep this flow and its payment behavior compatible.
- The server already has VIP application, reference lookup, tracking, and queue routes under `/api/vip-tickets`.
- The admin dashboard authenticates with the existing admin session and sends requests through `adminApi` in `frontend/src/services/adminApi.js` (cookie credentials included).
- The admin view currently needs these display fields: `reference`, `person`, `service`, `issuedAt`, and `status`.
- The admin statuses are `pending`, `in-progress`, and `completed`. These describe service handling—not payment state or physical queue position.

## Recommended server work

1. Add a dedicated admin list endpoint, preferably `GET /api/admin/vip-tickets`. Do not expose the full applicant list through a public endpoint. Protect it with the existing `authenticateAdmin` middleware and allow the dashboard roles (`SUPER_ADMIN` and `OPERATOR`).
2. Read tickets from the existing VIP application records. Map the stored fields into a small, stable response contract instead of returning database records directly.
3. Support server-side status filtering and pagination. Validate query values and return an explicit error for invalid filters.
4. Return timestamps as ISO 8601 strings and status values in the dashboard's lowercase format. The database may use a different enum internally; map it at the API boundary.
5. If staff need to change status later, add a separate authenticated status-update endpoint only after agreeing on workflow and permissions. Validate allowed transitions and record who changed the status and when. The current dashboard is read-only and does not require that endpoint.

### Suggested list contract

Request:

```http
GET /api/admin/vip-tickets?status=pending&page=1&limit=25
Cookie: existing admin session
```

Response:

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

For the first integration, `status` may be omitted to return all statuses. Use only these values when supplied: `pending`, `in-progress`, `completed`. Return a consistent JSON error and appropriate HTTP status for unauthorized, forbidden, invalid-query, or server-error cases.

### Status mapping

Agree on one field that represents the staff's service-processing lifecycle and map it to:

| API status | Meaning |
|---|---|
| `pending` | Application is accepted and waiting for staff to begin service |
| `in-progress` | Staff has started handling the requested service |
| `completed` | Requested service has been finished |

Do not derive this status from payment success, payment failure, queue position, or whether the ticket was enqueued. Preserve those as separate concepts. If the current database has no service-processing field, add one with a safe default of `pending`; do not overload an unrelated payment or queue field.

## Recommended admin frontend work

When the server endpoint is ready:

1. Add a `listVipTickets` method to `adminApi` in `frontend/src/services/adminApi.js`, using the existing request helper so session cookies, API errors, and expired sessions are handled consistently.
2. Replace the `DEMO_TICKETS` data in `frontend/src/components/admin/VipTicketsManager.jsx` with fetched `data`. Remove the demo-data notice only after the endpoint is connected successfully.
3. Show loading, empty, and error states. Keep the existing status labels, filters, and summary counts; use `meta.statusCounts` for counts across all pages.
4. Send pagination and filter values to the server if the list can exceed one page. Do not fetch applicant names through the public-facing API.
5. Keep status updates out of the admin UI until the backend update contract and staff workflow are agreed.

## Staff dashboard role recommendation

The admin frontend now recognizes the `STAFF` role and, for that role, opens directly to the VIP tickets tab while hiding the other dashboard sections and overview. This is a UI restriction only; it is not an authorization boundary.

The current server supports only `SUPER_ADMIN` and `OPERATOR` during login and in `authenticateAdmin`. Before Staff can actually sign in, the server owner should:

1. Add `STAFF` to the persisted user-role enum and apply the database migration.
2. Update the server login and session-authentication role allowlists so active `STAFF` users can authenticate and `/api/auth/me` returns their role.
3. Keep authorization server-side: grant `STAFF` only the VIP ticket read endpoint (and any separately agreed ticket workflow actions). Do not grant access to institution, service, content, settings, or inbox endpoints just because the user can load the dashboard UI.
4. Ensure staff accounts are provisioned by an authorized administrator and inactive accounts are rejected as today.
5. Add role tests covering successful Staff authentication, denied access to non-VIP admin endpoints, and successful access to the authorized VIP endpoint.

The admin frontend should call only the VIP ticket endpoint for Staff. Once that endpoint is implemented, skip loading unrelated dashboard resources for Staff and handle VIP-list loading, errors, empty results, filtering, and pagination independently. The public VIP application/payment client does not need to be changed for Staff dashboard login; preserve its existing application and payment contracts.

## Recommended public-client compatibility

- Keep the existing application creation and payment request/response behavior intact, including `data.reference`.
- Ensure successfully created applications have a durable record and an initial service-processing status that the admin API can map to `pending`.
- Do not add a public endpoint that lists all applicants or reveals applicant details. If applicants need to track their own ticket, retain a reference/identity-verified lookup and return only information appropriate for that applicant.
- Keep payment status, queue status, and staff service-processing status separate in both payloads and UI labels.

## Acceptance checks

- An unauthenticated request to the admin list is rejected; an authenticated user without an allowed role is forbidden.
- An authorized admin receives only the agreed ticket fields, with valid ISO dates and one of the three statuses.
- Filtering and pagination produce correct ticket rows and total status counts.
- Existing public application creation and payment flows still work and preserve the returned reference.
- The admin page shows useful loading, error, and empty states and no longer shows demo data after API integration.
- Staff accounts can sign in, land on VIP tickets only, and are rejected by the server when requesting any unrelated admin resource.
