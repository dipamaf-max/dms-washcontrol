import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase non configuré (variables FIREBASE_*) - notifications push désactivées',
      );
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    this.initialized = true;
  }

  async sendToTokens(tokens: string[], title: string, body: string) {
    if (!this.initialized || tokens.length === 0) return;
    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
      });
    } catch (error) {
      this.logger.error('Échec envoi notification FCM', error as Error);
    }
  }
}
