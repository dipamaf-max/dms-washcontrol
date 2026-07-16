# DMS WashControl

Plateforme SaaS pour la gestion à distance de stations de lavage automobile : API backend, dashboard web administrateur et application mobile pour les employés/propriétaires.

## Stack technique

| Composant | Technologie |
|---|---|
| Backend API | NestJS + Prisma + PostgreSQL, JWT (access + refresh) |
| Dashboard web | React + TypeScript + Vite |
| Application mobile | Flutter (Android/iOS/Web) |
| Notifications | Firebase Cloud Messaging (à configurer) |
| Paiements | Orange Money / Wave / MTN Money (intégration préparée, clés API à fournir) |
| Infrastructure | Docker / docker-compose |

## Structure du projet

```
dms-washcontrol/
├── backend/          API NestJS (auth, stations, véhicules, lavages, finances, stock, abonnements...)
├── web-admin/         Dashboard React pour propriétaires/administrateurs
├── mobile/            Application Flutter pour employés (scan QR, lavages, véhicules)
├── docker-compose.yml Postgres + backend + web-admin
└── docs/              Documentation complémentaire
```

## Modules fonctionnels

1. **Authentification** — rôles ADMIN / OWNER (propriétaire) / EMPLOYEE, JWT access+refresh
2. **Stations** — création, gestion, statut d'abonnement
3. **Véhicules** — fiche véhicule, QR Code unique, photos avant/après
4. **Lavages (WashOrder)** — cycle PENDING → IN_PROGRESS → DONE → DELIVERED, génère automatiquement une transaction de revenu et des points fidélité
5. **Clients (CRM)** — historique, points fidélité
6. **Finances** — transactions entrées/dépenses, rapports journaliers/mensuels
7. **Employés** — présence (check-in/out), commission, performance
8. **Stock (Inventory)** — entrées/sorties, alertes de stock faible
9. **Abonnement SaaS** — plans STARTER (10 000 FCFA), BUSINESS (15 000 FCFA), PREMIUM (20 000 FCFA), expiration automatique quotidienne
10. **Tableau de bord** — CA du jour, véhicules lavés, employés actifs, dépenses, bénéfices, meilleurs clients
11. **QR Code** — génération et scan pour retrouver un véhicule et son historique
12. **Notifications** — Firebase Cloud Messaging (à connecter à un vrai projet Firebase)
13. **Sécurité** — validation des DTO (class-validator), guards JWT + rôles, logs d'activité, scoping strict par station

## Démarrage rapide avec Docker (recommandé)

Prérequis : Docker + Docker Compose installés.

```bash
docker compose up --build
```

Cela démarre PostgreSQL, exécute les migrations Prisma + le seed (plans d'abonnement + compte admin), lance l'API sur `http://localhost:3000/api/v1` et le dashboard web sur `http://localhost:5173`.

Compte administrateur créé par le seed : `admin@dmswashcontrol.com` / `Admin@123` (à changer immédiatement).

## Démarrage manuel (sans Docker)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # renseigner DATABASE_URL vers votre PostgreSQL
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

L'API écoute sur `http://localhost:3000/api/v1`.

### 2. Dashboard web

```bash
cd web-admin
npm install
cp .env .env.local 2>/dev/null || true  # ajuster VITE_API_URL si besoin
npm run dev
```

Disponible sur `http://localhost:5173`.

### 3. Application mobile Flutter

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://<IP_DE_VOTRE_BACKEND>:3000/api/v1
```

Sur émulateur Android, l'API locale est accessible via `http://10.0.2.2:3000/api/v1` (valeur par défaut déjà configurée).

## Variables d'environnement (backend/.env)

Voir [backend/.env.example](backend/.env.example) : connexion PostgreSQL, secrets JWT, configuration Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), configuration GeniusPay (`GENIUSPAY_API_KEY`, `GENIUSPAY_API_SECRET`, `GENIUSPAY_WEBHOOK_SECRET`).

## Intégrations à finaliser

- **Firebase Cloud Messaging** : guide pas-à-pas dans [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md). Sans configuration, les notifications push sont désactivées silencieusement côté backend (le reste de l'application fonctionne normalement) ; côté mobile, le plugin Gradle `google-services` étant déjà câblé, **la compilation Android échouera** tant que `mobile/android/app/google-services.json` n'existe pas.
- **Mobile Money (Orange Money, MTN, Moov, Wave via GeniusPay)** : guide complet dans [docs/GENIUSPAY_INTEGRATION.md](docs/GENIUSPAY_INTEGRATION.md). `backend/src/subscriptions/mobile-money.service.ts` est câblé sur la vraie API GeniusPay (initiation de paiement + vérification de statut + webhook signé HMAC-SHA256 sur `/api/v1/webhooks/geniuspay`). Les trois variables (`GENIUSPAY_API_KEY` / `GENIUSPAY_API_SECRET` / `GENIUSPAY_WEBHOOK_SECRET`) sont configurées avec de vraies clés **Sandbox**, et le webhook GeniusPay pointe vers l'URL réelle de production ci-dessous. Passage en clés **Live** possible une fois le KYC validé à 3/3.

## Déploiement (Render)

- **Backend** : déployé sur Render (Docker, plan gratuit) → `https://dms-washcontrol.onrender.com/api/v1`. Base PostgreSQL Render également sur plan gratuit (`dms-washcontrol-db`, région Frankfurt, **expire le 15 août 2026** sauf passage sur un plan payant). Les migrations Prisma s'exécutent automatiquement au démarrage du conteneur (`prisma migrate deploy` dans le `CMD` du Dockerfile).
- ⚠️ **Plan gratuit Render = disque éphémère** : les fichiers uploadés dans `backend/uploads` (photos avant/après véhicules) sont **perdus à chaque redéploiement ou redémarrage**. Pour un usage réel il faudra soit un disque persistant Render (payant), soit un stockage externe (S3, Cloudinary...).
- ⚠️ L'instance gratuite Render se met en veille après inactivité ; la première requête après une pause peut prendre 30-60 secondes.
- `CORS_ORIGIN` est actuellement configuré pour le développement local — à mettre à jour avec l'URL du dashboard web une fois celui-ci déployé.

## Comptes et rôles

| Rôle | Accès |
|---|---|
| ADMIN | Toutes les stations, gestion des utilisateurs |
| OWNER (propriétaire) | Ses propres stations : employés, finances, stock, abonnement |
| EMPLOYEE | Sa station assignée : véhicules, lavages, présence |

L'inscription publique (`POST /auth/register`) crée toujours un compte **OWNER**. Les comptes EMPLOYEE sont créés par le propriétaire via `POST /employees`.

## Notes de développement

- Le schéma de données complet est dans [backend/prisma/schema.prisma](backend/prisma/schema.prisma).
- Le backend a été vérifié par compilation (`nest build`), démarrage réel (tous les modules s'initialisent, toutes les routes sont mappées correctement), et par une suite de tests unitaires Jest (`npm test` dans `backend/`) couvrant l'authentification, le contrôle d'accès par station/rôle, la machine à états des lavages et la gestion du stock. Les tests bout-en-bout nécessitent une instance PostgreSQL active (fournie automatiquement par `docker compose`).
- L'application mobile a été vérifiée par `flutter test` et `flutter build web` (compilation complète réussie) en l'absence d'émulateur Android/iOS disponible dans cet environnement.
