import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { User } from '../../generated/prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { SetRoleDto } from './dto/set-role.dto';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@UseGuards(FirebaseAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  me(@CurrentUser() user: User): User {
    return user;
  }

  // The post-sign-in "what's your main purpose" prompt posts here once —
  // the client only shows that prompt while user.role is still null.
  @Patch('role')
  setRole(@CurrentUser() user: User, @Body() dto: SetRoleDto) {
    return this.auth.setRole(user.id, dto.role);
  }
}
