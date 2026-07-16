# Intégration GeniusPay (Mobile Money)

DMS WashControl utilise [GeniusPay](https://geniuspay.ci/) comme agrégateur de paiement mobile money : une seule intégration donne accès à Orange Money, MTN Mobile Money, Moov Money et Wave, au lieu de négocier un accord séparé avec chaque opérateur.

Documentation officielle : https://pay.genius.ci/doc

## 1. Créer un compte marchand

1. Rejoins la liste d'attente sur https://onboarding.geniuspay.ci/
2. Fournis les documents requis (pièce d'identité, description du projet, business plan — voir [Business-Plan-DMS-WashControl.pdf](Business-Plan-DMS-WashControl.pdf))
3. Une fois approuvé, récupère dans le tableau de bord (`geniuspay.ci/dashboard/integrations`) :
   - **Clé publique (API Key)** — utilisée dans le header `X-API-Key` (préfixe `sk_sandbox_...` / `sk_live_...` sur le tableau de bord, malgré le nom "publique")
   - **Clé secrète (API Secret)** — utilisée pour signer les requêtes côté serveur (préfixe `ss_sandbox_...` / `ss_live_...`)
   - Un **secret de webhook** (`whsec_...`) — non affiché sur la page "Intégrations" ; à chercher dans une section dédiée "Webhooks" du tableau de bord

⚠️ Les clés visibles par défaut sont en mode **Sandbox** (test, aucun débit réel). Les clés **Live** ne sont disponibles qu'après validation complète du KYC (le compte affiche "KYC Niv.X/3").

## 2. Configurer le backend

Dans `backend/.env` :

```
GENIUSPAY_API_KEY="pk_live_..."
GENIUSPAY_API_SECRET="sk_live_..."
GENIUSPAY_WEBHOOK_SECRET="whsec_..."
```

Configure ensuite dans le tableau de bord GeniusPay l'URL de webhook :
```
https://dms-washcontrol.onrender.com/api/v1/webhooks/geniuspay
```

✅ Backend déployé sur Render (plan gratuit) et webhook Sandbox configuré et actif avec cette URL.

⚠️ Cette URL doit être **publiquement accessible**. En développement local, utilise un tunnel (ngrok, Cloudflare Tunnel) si tu veux tester les webhooks avant la mise en production.

## Comment ça fonctionne

1. **Initiation** (`POST /subscriptions`) : `mobile-money.service.ts` envoie `amount`, `payment_method` (orange_money / wave / mtn_money / moov_money), `customer.phone`, `description` à `POST https://geniuspay.ci/api/v1/merchant/payments`.
2. GeniusPay répond avec `{ success, data: { reference, status, checkout_url } }` — `checkout_url` est la page de paiement présentée au client (le frontend l'ouvre automatiquement dans un nouvel onglet).
3. Le client complète le paiement (choix Orange Money / MTN / Moov / Wave).
4. **Confirmation** : deux mécanismes :
   - **Webhook signé** (`POST /api/v1/webhooks/geniuspay`, public) : GeniusPay notifie le backend avec une signature HMAC-SHA256 (`X-Webhook-Signature`) et un timestamp (`X-Webhook-Timestamp`). Géré par `GeniusPayWebhookController` / `SubscriptionsService.handleGeniusPayWebhook`.
   - **Vérification manuelle** (`POST /subscriptions/payments/:paymentId/confirm`, réservé OWNER) : utile en développement ou si le webhook n'est pas joignable.

## Sécurité du webhook

Contrairement à l'intégration précédente, GeniusPay **signe cryptographiquement** chaque webhook :

- `SubscriptionsService.verifyGeniusPaySignature` recalcule `HMAC-SHA256(timestamp + "." + JSON.stringify(payload), GENIUSPAY_WEBHOOK_SECRET)` et la compare (en temps constant, via `timingSafeEqual`) à la signature reçue.
- **Protection anti-rejeu** : tout webhook dont le timestamp a plus de 5 minutes est rejeté.
- Ce n'est qu'une fois la signature validée que le statut du paiement (`completed`, `pending`, `failed`, etc.) est utilisé pour activer un abonnement.

## Limite du mode Sandbox

En Sandbox, `GET /payments/{reference}` (utilisé par la vérification manuelle de secours) renvoie `TRANSACTION_NOT_FOUND` juste après la création — les transactions de test ne semblent pas persistées pour une relecture ultérieure. Le **webhook signé reste le seul mécanisme de confirmation fiable en sandbox** ; ce comportement n'affecte a priori que le mode test (à reconfirmer une fois les clés Live disponibles).

## Statuts de paiement

`pending`, `processing`, `completed`, `failed`, `cancelled`, `refunded`, `expired`. Seul `completed` déclenche l'activation de l'abonnement.

## Opérateurs supportés (Côte d'Ivoire)

Orange Money, MTN Mobile Money, Moov Money, Wave — auto-détection possible de l'opérateur via `GET /api/v1/merchant/pawapay/providers?country=CI`.
