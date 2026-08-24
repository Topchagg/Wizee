import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from '../../generated/prisma/client';
import { CurrentUser } from './current-user.decorator';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User): User {
    return user;
  }
}
