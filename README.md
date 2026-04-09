# Portal Frontend Angular

Angular frontend for the Portal system, migrated from the previous React app and aligned to backend contract in `portal_backend/openapi.yaml`.

## Scope implemented

- Public auth flows:
  - `POST /auth/login`
  - `POST /auth/register`
  - `POST /auth/verify-email`
  - `POST /auth/resend-verification`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `POST /auth/set-password`
- Protected account flows:
  - `GET /users/me`
  - `PUT /users/me`
  - `PUT /users/me/change-password`
- Admin user flows:
  - `GET /admin/users`
  - `POST /admin/users`
  - `GET /admin/users/{userId}`
  - `PUT /admin/users/{userId}`
  - `PUT /admin/users/{userId}/role`
  - `DELETE /admin/users/{userId}/delete`
  - `PUT /admin/users/{userId}/restore`

## Auth model

- Uses Bearer token for protected APIs (`Authorization: Bearer <access_token>`)
- Stores `access_token`, `refresh_token`, `expires_at`, and `user` in localStorage
- Interceptor auto-refreshes token via `POST /auth/refresh` on `401`
- Clears session and redirects to `/login` when refresh fails

## Run

```bash
npm install
npm start
```

Default dev proxy forwards `/api` to `http://localhost:8000` via `proxy.conf.json`.

## Notes

- API base URL is configured in `src/environments/environment.ts` (`/api/v1`)
- UI keeps the previous flow and structure, with responsive improvements for mobile table/cards and dialogs
