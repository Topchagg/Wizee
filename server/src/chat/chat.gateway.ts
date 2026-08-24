import { Inject, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { FIREBASE_ADMIN, type FirebaseAppGetter } from '../auth/firebase-admin.provider';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

// Simple direct chat, no RBAC: any authenticated user can message any other.
// REST (ChatController) handles loading history; this handles live delivery.
@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(FIREBASE_ADMIN) private readonly getFirebaseApp: FirebaseAppGetter,
    private readonly prisma: PrismaService,
    private readonly chat: ChatService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = await this.getFirebaseApp().auth().verifyIdToken(token);
      if (!decoded.email) {
        throw new Error('Firebase account has no email');
      }

      // Same self-healing upsert as FirebaseAuthGuard — a user's very first
      // authenticated action could be opening the chat page.
      const user = await this.prisma.user.upsert({
        where: { firebaseUid: decoded.uid },
        update: { email: decoded.email, displayName: decoded.name ?? null, photoUrl: decoded.picture ?? null },
        create: {
          firebaseUid: decoded.uid,
          email: decoded.email,
          displayName: decoded.name,
          photoUrl: decoded.picture,
        },
      });

      socket.data.userId = user.id;
      await socket.join(this.roomFor(user.id));
    } catch (err) {
      this.logger.warn(`Rejected socket connection: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('sendMessage')
  async handleSendMessage(@ConnectedSocket() socket: Socket, @MessageBody() dto: SendMessageDto) {
    const senderId: string = socket.data.userId;
    const message = await this.chat.sendMessage(senderId, dto);

    // Emit to both sides' rooms — the recipient (if connected, any tab) and
    // back to the sender (so other open tabs get the persisted message too).
    this.server.to(this.roomFor(dto.recipientId)).to(this.roomFor(senderId)).emit('newMessage', message);

    return message;
  }

  private roomFor(userId: string): string {
    return `user:${userId}`;
  }
}
