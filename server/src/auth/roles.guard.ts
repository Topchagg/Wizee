import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role, User } from '../../generated/prisma/client';
import { ROLES_KEY } from './roles.decorator';

// Must run after FirebaseAuthGuard (which attaches request.user) — routes
// pair them as @UseGuards(FirebaseAuthGuard, RolesGuard).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();
    // SUPERADMIN passes every role check, unconditionally — it's the one
    // role that's never assigned via the app, only by an operator editing
    // the DB directly, so there's no self-service path to this bypass.
    if (user.role === 'SUPERADMIN') {
      return true;
    }
    if (!user.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('This action requires the Tutoring role');
    }
    return true;
  }
}
