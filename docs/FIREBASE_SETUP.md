# Configurer Firebase Cloud Messaging (notifications push)

Le code est déjà préparé (backend `firebase-admin`, mobile `firebase_core`/`firebase_messaging`, plugin Gradle `google-services`). Il ne manque que les identifiants d'un vrai projet Firebase.

## 1. Créer le projet Firebase

1. Va sur https://console.firebase.google.com/
2. **Ajouter un projet** → nomme-le par ex. `dms-washcontrol`
3. Désactive Google Analytics si tu ne l'utilises pas (pas nécessaire pour FCM)
4. Clique sur **Créer le projet**

## 2. Ajouter l'application Android

1. Dans le projet Firebase, clique sur l'icône Android pour ajouter une app
2. **Nom du package Android** : `com.dmswashcontrol.dms_washcontrol` (doit correspondre exactement)
3. Télécharge le fichier **`google-services.json`** généré
4. Place-le dans : `mobile/android/app/google-services.json`

Sans ce fichier, la compilation Android (`flutter build apk`) échouera désormais (le plugin Gradle `google-services` l'exige). La compilation web n'est pas affectée.

## 3. Récupérer les identifiants pour le backend (Admin SDK)

1. Dans la console Firebase : **Paramètres du projet** (roue crantée) → **Comptes de service**
2. Clique sur **Générer une nouvelle clé privée** → télécharge le fichier JSON
3. Dans ce fichier JSON, récupère trois valeurs :
   - `project_id`
   - `client_email`
   - `private_key`
4. Renseigne-les dans `backend/.env` :

```
FIREBASE_PROJECT_ID="<project_id>"
FIREBASE_CLIENT_EMAIL="<client_email>"
FIREBASE_PRIVATE_KEY="<private_key>"
```

Le `private_key` contient des `\n` littéraux dans le JSON téléchargé — garde-les tels quels entre guillemets, le backend les convertit automatiquement (`firebase.service.ts`).

## 4. (Optionnel) Application iOS

1. Dans la console Firebase, ajoute une app iOS avec le Bundle ID de ton choix
2. Télécharge `GoogleService-Info.plist` et place-le dans `mobile/ios/Runner/`
3. Nécessite Xcode pour finaliser l'intégration (non disponible sur cet environnement Windows)

## 5. Vérifier que ça fonctionne

- Backend : au démarrage, si les 3 variables `FIREBASE_*` sont renseignées, `firebase.service.ts` initialise l'Admin SDK (sinon il log un avertissement et désactive silencieusement les push — le reste de l'app continue de fonctionner)
- Mobile : après connexion, `NotificationService.init()` (`mobile/lib/core/notification_service.dart`) demande la permission, récupère le token FCM et l'enregistre côté backend (`POST /notifications/device-tokens`)
- Test d'envoi : n'importe quel appel à `NotificationsService.notifyUser(userId, title, message)` côté backend enverra désormais une vraie notification push en plus de l'enregistrer en base

## Ce que je ne peux pas faire à ta place

Créer le projet Firebase nécessite un compte Google et une interaction dans la console web — je ne peux pas le faire pour toi. Une fois les fichiers/valeurs récupérés, dis-le moi et je peux vérifier la configuration ou déboguer un souci d'intégration.
