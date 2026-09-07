import { Injectable } from '@nestjs/common';
import type { Role } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // One-time (in practice) onboarding choice — the client only ever shows
  // the prompt while role is still null, so this isn't otherwise gated
  // against being called again, matching how the rest of this API treats
  // a user's own data.
  async setRole(userId: string, role: Role) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
