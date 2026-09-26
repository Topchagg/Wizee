import { Injectable } from '@nestjs/common';
import type { Role } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  // Profile settings — displayName/photoUrl start seeded from Google (see
  // FirebaseAuthGuard) but are user-owned from here on. Only patches fields
  // actually sent, so e.g. saving a new bio doesn't require resending name.
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }
}
