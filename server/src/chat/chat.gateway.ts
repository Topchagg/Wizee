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
import {
  FIREBASE_ADMIN,
  type FirebaseAppGetter,
} from '../auth/firebase-admin.provider';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

// socket.io's `Socket.data` is untyped (`any`) unless generics are threaded
// through @WebSocketGateway — this cast is the minimal way to read/write
// `userId` on it without triggering unsafe-member-access.
interface ChatSocketData {
  userId: string;
}

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

      // Same self-healing provisioning as FirebaseAuthGuard — a user's very
      // first authenticated action could be opening the chat page. Read
      // first rather than unconditionally upsert, same reasoning as the
      // guard: this runs on every socket connection, and the common case
      // (existing user, nothing changed) shouldn't cost a write.
      const email = decoded.email;
      const displayName = (decoded.name as string | undefined) ?? null;
      const photoUrl = decoded.picture ?? null;

      let user = await this.prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: { firebaseUid: decoded.uid, email, displayName, photoUrl },
        });
      } else if (
        user.email !== email ||
        user.displayName !== displayName ||
        user.photoUrl !== photoUrl
      ) {
        user = await this.prisma.user.update({
          where: { firebaseUid: decoded.uid },
          data: { email, displayName, photoUrl },
        });
      }

      (socket.data as ChatSocketData).userId = user.id;
      await socket.join(this.roomFor(user.id));
    } catch (err) {
      this.logger.warn(`Rejected socket connection: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const senderId = (socket.data as ChatSocketData).userId;
    const message = await this.chat.sendMessage(senderId, dto);

    // Emit to both sides' rooms — the recipient (if connected, any tab) and
    // back to the sender (so other open tabs get the persisted message too).
    this.server
      .to(this.roomFor(dto.recipientId))
      .to(this.roomFor(senderId))
      .emit('newMessage', message);

    return message;
  }

  private roomFor(userId: string): string {
    return `user:${userId}`;
  }
}
