import { IsIn } from 'class-validator';

// Deliberately NOT derived from the full Prisma `Role` enum — SUPERADMIN
// exists in the schema but must never be settable through this endpoint
// (or any app flow). Granting it is a direct DB edit, by design.
const ROLES = ['TUTOR', 'LEARNER'] as const;

export class SetRoleDto {
  @IsIn(ROLES)
  role: (typeof ROLES)[number];
}
