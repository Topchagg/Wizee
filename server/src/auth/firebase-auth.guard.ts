import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import {
  FIREBASE_ADMIN,
  type FirebaseAppGetter,
} from './firebase-admin.provider';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly getFirebaseApp: FirebaseAppGetter,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      // Credential parsing happens lazily inside getFirebaseApp() on first
      // call, so a bad/placeholder Firebase config surfaces here as a clean
      // 401 instead of crashing the whole app at bootstrap.
      decoded = await this.getFirebaseApp().auth().verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!decoded.email) {
      throw new UnauthorizedException('Firebase account has no email');
    }

    // Self-healing: first authenticated request for a Firebase user provisions
    // their app-level User row, so there's no separate "register" step to forget.
    (request as Request & { user: unknown }).user =
      await this.prisma.user.upsert({
        where: { firebaseUid: decoded.uid },
        update: {
          email: decoded.email,
          displayName: (decoded.name as string | undefined) ?? null,
          photoUrl: decoded.picture ?? null,
        },
        create: {
          firebaseUid: decoded.uid,
          email: decoded.email,
          displayName: decoded.name as string | undefined,
          photoUrl: decoded.picture,
        },
      });

    return true;
  }
}
