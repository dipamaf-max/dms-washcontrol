# DMS WashControl — Application mobile

Application Flutter destinée aux employés (enregistrement véhicules, scan QR Code, mise à jour du statut des lavages) et propriétaires (tableau de bord rapide) des stations de lavage.

## Lancer le projet

```bash
flutter pub get
flutter run --dart-define=API_URL=http://<IP_BACKEND>:3000/api/v1
```

Sur émulateur Android, `http://10.0.2.2:3000/api/v1` (valeur par défaut) pointe vers le backend lancé sur la machine hôte.

> ⚠️ **Compilation Android** : le plugin Gradle `google-services` est déjà activé (préparation Firebase). Place un fichier `android/app/google-services.json` valide avant `flutter build apk` / `flutter run` sur Android, sinon le build Gradle échoue. Voir [docs/FIREBASE_SETUP.md](../docs/FIREBASE_SETUP.md). La cible web ne nécessite pas ce fichier.

## Fonctionnalités

- Connexion (JWT access + refresh, persistée localement)
- Sélection de station (si l'utilisateur en a plusieurs)
- Tableau de bord : CA du jour, véhicules lavés, employés actifs, bénéfices, meilleurs clients
- Scan QR Code d'un véhicule → historique + création rapide d'un nouveau lavage
- Suivi des lavages en cours avec changement de statut (En attente → En cours → Terminé → Livré)
- Enregistrement d'un nouveau véhicule (+ client associé)
- Notifications push (Firebase Cloud Messaging) — désactivées tant qu'un vrai projet Firebase n'est pas configuré (voir README racine)

## Vérifications effectuées

- `flutter analyze` : aucun problème
- `flutter test` : tests passent
- `flutter build web` : compilation complète réussie

Aucun émulateur Android/iOS n'était disponible dans l'environnement de développement ; la compilation web a servi de vérification de bout en bout du code Dart. Testez sur émulateur/appareil réel avant mise en production.
