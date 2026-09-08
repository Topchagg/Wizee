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
    // their app-level User row, so there's no separate "register" step to
    // forget. Read first rather than unconditionally upsert — this guard
    // runs on every authenticated request across the whole API, so writing
    // on every one of them (even when nothing changed since last time, the
    // overwhelmingly common case) turns the hottest path in the app into a
    // row-contention hazard for no reason.
    const email = decoded.email;
    const displayName = (decoded.name as string | undefined) ?? null;
    const photoUrl = decoded.picture ?? null;

    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: { firebaseUid: decoded.uid, email, displayName, photoUrl },
      });
    } else if (
      user.email !== email ||
      user.displayName !== displayName ||
      user.photoUrl !== photoUrl
    ) {
      user = await this.prisma.user.update({
        where: { firebaseUid: decoded.uid },
        data: { email, displayName, photoUrl },
      });
    }

    (request as Request & { user: unknown }).user = user;

    return true;
  }
}
