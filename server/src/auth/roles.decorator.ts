import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../generated/prisma/client';

export const ROLES_KEY = 'roles';

// Marks a route as requiring one of the given Roles — enforced by RolesGuard,
// which must run after FirebaseAuthGuard so `request.user` is populated.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
