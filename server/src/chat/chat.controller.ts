import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { User } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ChatService } from './chat.service';

// Read-only over REST (initial load); sending happens over the WebSocket
// gateway — see chat.gateway.ts.
@UseGuards(FirebaseAuthGuard)
@Controller('messages')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('users')
  listOtherUsers(@CurrentUser() user: User) {
    return this.chat.listOtherUsers(user.id);
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: User) {
    return this.chat.listConversations(user.id);
  }

  @Get(':otherUserId')
  getConversation(
    @Param('otherUserId') otherUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.chat.getConversation(user.id, otherUserId);
  }
}
