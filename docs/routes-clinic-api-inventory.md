# Clinic API Consumer Inventory

This document records the current HTTP consumers of `frontend-clinic`. It is a baseline for route organization work; it does not change any online path, method, namespace, or response contract.

## API Transport

- Base URL: `VITE_API_BASE`, with the local fallback resolved by `src/config/api.ts`.
- Main wrapper: `src/utils/apiFetch.ts`.
- Automatic headers: `Accept: application/json`, `X-Device-Id`, and `Authorization: Bearer <accessToken>` when a token exists.
- JSON requests receive `Content-Type: application/json` automatically.
- Errors are exposed through `ApiError`, including HTTP status and API code. Messages are extracted from `detail`, `non_field_errors`, `tenant_slug`, or `message`.
- Unauthorized and forbidden responses can trigger device-session handling and automatic logout.

## Authentication And Sessions

| Method | Path | Consumer | Request and response notes |
| --- | --- | --- | --- |
| POST | `/token/` | Login flow | Body: `login`, `password`, `device_id`, `tenant_slug`. Stores the access token and professional/tenant data from the response. |
| GET | `/sessions/summary` | `src/services/sessions.ts` | Lazy device-session check with a cooldown. |
| GET | `/sessions/active` | `src/hooks/useSessions.ts` | Lists active device sessions. |
| POST | `/sessions/revoke` | `src/hooks/useSessions.ts` | Revokes all other sessions or a selected session. |

Authentication data is kept in `localStorage` under the existing Clinic keys, including `accessToken` and `loggedProfessional`.

## Clients And Public Anamnesis

| Method | Path | Consumer | Request and response notes |
| --- | --- | --- | --- |
| GET | `/register/clients-basic/` | `src/hooks/useClients.ts` | Lightweight client list, including contact and next-appointment data. |
| GET | `/register/clients/{id}/` | `src/hooks/useClients.ts` | Loads a client detail. |
| POST | `/register/clients/` | `src/hooks/useClients.ts` | Creates an authenticated client. |
| PATCH | `/register/clients/{id}/` | `src/hooks/useClients.ts` | Updates an authenticated client. |
| DELETE | `/register/clients/{id}/` | `src/hooks/useClients.ts` | Deletes an authenticated client. |
| POST | `/register/clients/{id}/generate-anamnesis-token/` | Client flow | Generates a public anamnesis link token. |
| POST | `/register/clients/validate-anamnesis-token/` | Client form flow | Validates a public token and its expiration. |
| POST | `/register/clients/submit-public-anamnesis/` | `src/components/ClientForm/useSpecialtyAnamnesis.ts` | Public submission; uses the URL token flow and does not depend on a Bearer token. |

## Agenda

| Method | Path | Query/body notes |
| --- | --- | --- |
| GET | `/agenda/appointments/` | Query parameters include `start`, `end`, `client`, `status`, `limit`, and `ordering`. |
| POST | `/agenda/appointments/` | Creates an appointment. |
| PATCH | `/agenda/appointments/{id}/` | Updates an appointment. |
| POST | `/agenda/appointments/{id}/done/` | Marks an appointment as completed. |
| POST | `/agenda/appointments/{id}/cancel/` | Cancels an appointment; the flow can refresh the device session before retrying after `401` or `403`. |

The main save behavior is in `src/hooks/useScheduleSave.ts`. Appointment requests use distinct foreground/background timeouts and bounded retries for creation.

## Inventory And Clinical Catalogs

| Method | Path | Consumer |
| --- | --- | --- |
| GET | `/inventory/services/` | `src/hooks/useClinicalCatalogs.ts` |
| GET | `/inventory/products/?is_active=true` | `src/hooks/useClinicalCatalogs.ts` |
| GET | `/inventory/services/{id}/` | Catalog detail flow |
| GET | `/inventory/products/{id}/` | Catalog detail flow |
| POST | `/inventory/services/` | Catalog administration flow |
| PATCH | `/inventory/services/{id}/` | Catalog administration flow |
| POST | `/inventory/products/` | Catalog administration flow |

## Treatment Plans And Anamnesis

| Method | Path | Consumer |
| --- | --- | --- |
| GET | `/clinic/treatment/plans/?client={id}` | `src/hooks/useClinicalTreatmentPlans.ts` |
| POST | `/clinic/treatment/plans/` | `src/hooks/useClinicalTreatmentPlans.ts` |
| PATCH | `/clinic/treatment/plans/{id}/` | `src/hooks/useClinicalTreatmentPlans.ts` |
| GET | `/clinic/treatment/items/?plan={id}` | `src/hooks/useClinicalTreatmentPlans.ts` |
| POST | `/clinic/treatment/items/` | `src/hooks/useClinicalTreatmentPlans.ts` |
| PATCH | `/clinic/treatment/items/{id}/` | `src/hooks/useClinicalTreatmentPlans.ts` |
| DELETE | `/clinic/treatment/items/{id}/` | `src/hooks/useClinicalTreatmentPlans.ts` |
| POST | `/clinic/treatment/anamnesis/` | `src/components/ClientForm/useSpecialtyAnamnesis.ts` |

Treatment item responses use the existing service/product distinction and fields such as `plan`, `kind`, `service_name`, `patient_price`, `quantity`, `status`, and `started_at`.

## External Requests And Links

- `src/hooks/useViaCep.ts` uses native `fetch` against `https://viacep.com.br/ws/{cep}/json/` for address lookup. This is not a backend route consumer.
- `src/utils/whatsapp.ts` builds `https://api.whatsapp.com/send?...` links. It does not perform an API request.
- No multipart upload or `FormData` consumer was found for client documents or anamnesis.

## Validation Scripts

From the frontend Clinic root:

```bash
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```

These commands validate the TypeScript contract, lint rules, Vitest suite, and production build without changing the API paths documented above.
