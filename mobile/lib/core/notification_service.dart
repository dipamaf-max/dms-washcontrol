import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

/// Firebase Cloud Messaging integration point.
///
/// Requires `android/app/google-services.json` (and `ios/Runner/GoogleService-Info.plist`
/// for iOS) from a real Firebase project before this can connect. Until then,
/// [init] fails silently so the rest of the app keeps working without push notifications.
class NotificationService {
  static Future<void> init() async {
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      final token = await messaging.getToken();
      if (token != null) {
        await ApiClient.instance.dio.post('/notifications/device-tokens', data: {
          'token': token,
          'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android',
        });
      }
    } catch (error) {
      debugPrint('Firebase non configuré, notifications push désactivées: $error');
    }
  }
}
