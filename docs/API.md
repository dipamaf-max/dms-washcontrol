# DMS WashControl — Référence API

Base URL : `http://localhost:3000/api/v1`
Authentification : `Authorization: Bearer <accessToken>` (sauf `/auth/*`)

## Auth
- `POST /auth/register` — crée un compte OWNER
- `POST /auth/login` — retourne `{ user, accessToken, refreshToken }`
- `POST /auth/refresh` — renouvelle l'access token

## Users (ADMIN)
- `GET /users`
- `GET /users/:id`
- `PATCH /users/:id/active`

## Stations
- `POST /stations` (ADMIN, OWNER)
- `GET /stations`
- `GET /stations/:id`
- `PATCH /stations/:id` (ADMIN, OWNER)
- `DELETE /stations/:id` (ADMIN, OWNER)

## Employés
- `POST /employees` (OWNER)
- `GET /employees?stationId=`
- `POST /employees/:id/attendance/check-in`
- `POST /employees/:id/attendance/check-out`
- `GET /employees/:id/performance`

## Clients
- `POST /customers`
- `GET /customers?stationId=`
- `GET /customers/:id`
- `PATCH /customers/:id`

## Véhicules
- `POST /vehicles`
- `GET /vehicles?stationId=`
- `GET /vehicles/:id`
- `GET /vehicles/qr/:token` — recherche par QR Code
- `GET /vehicles/:id/qrcode` — image QR Code (data URL PNG)
- `PATCH /vehicles/:id`
- `POST /vehicles/:id/photos`

## Services (catalogue de lavages)
- `POST /services` (OWNER)
- `GET /services?stationId=`
- `PATCH /services/:id` (OWNER)

## Lavages (WashOrder)
- `POST /wash-orders`
- `GET /wash-orders?stationId=&status=`
- `GET /wash-orders/:id`
- `PATCH /wash-orders/:id/status` — transitions : `PENDING → IN_PROGRESS → DONE → DELIVERED`

## Finances
- `POST /transactions` (OWNER)
- `GET /transactions?stationId=&from=&to=&type=`
- `GET /transactions/reports/daily?stationId=&date=`
- `GET /transactions/reports/monthly?stationId=&year=&month=`

## Stock
- `POST /inventory` (OWNER)
- `GET /inventory?stationId=`
- `GET /inventory/low-stock?stationId=`
- `POST /inventory/:id/movements`

## Abonnement SaaS
- `GET /subscriptions/plans`
- `GET /subscriptions/current?stationId=`
- `POST /subscriptions` (OWNER)
- `POST /subscriptions/payments/:paymentId/confirm` (OWNER)

## Tableau de bord
- `GET /dashboard/overview?stationId=`

## Notifications
- `POST /notifications/device-tokens`
- `GET /notifications`
- `PATCH /notifications/:id/read`

## Fichiers
- `POST /uploads` (multipart/form-data, champ `file`) — retourne `{ url }`
