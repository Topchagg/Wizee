import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // No RBAC yet — any authenticated user can message any other. Student/
  // Teacher isn't a persisted role, just how people choose to use this.
  async sendMessage(senderId: string, dto: SendMessageDto) {
    return this.prisma.message.create({
      data: { senderId, recipientId: dto.recipientId, content: dto.content },
    });
  }

  async getConversation(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Groups this user's messages by counterpart, keeping only the most recent
  // one per counterpart — a simple app-level reduction rather than a fancy
  // SQL "distinct on", since MVP message volume doesn't need it.
  async listConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
    });

    const lastByCounterpart = new Map<string, (typeof messages)[number]>();
    for (const message of messages) {
      const counterpartId =
        message.senderId === userId ? message.recipientId : message.senderId;
      if (!lastByCounterpart.has(counterpartId)) {
        lastByCounterpart.set(counterpartId, message);
      }
    }

    const counterpartIds = [...lastByCounterpart.keys()];
    const counterparts = await this.prisma.user.findMany({
      where: { id: { in: counterpartIds } },
      select: { id: true, displayName: true, email: true },
    });
    const counterpartById = new Map(
      counterparts.map((user) => [user.id, user]),
    );

    return counterpartIds.map((id) => {
      const lastMessage = lastByCounterpart.get(id)!;
      const user = counterpartById.get(id);
      return {
        userId: id,
        name: user?.displayName ?? user?.email ?? 'Unknown user',
        lastMessage: lastMessage.content,
        lastMessageAt: lastMessage.createdAt,
        lastMessageFromMe: lastMessage.senderId === userId,
      };
    });
  }

  async listOtherUsers(userId: string) {
    return this.prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, displayName: true, email: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
