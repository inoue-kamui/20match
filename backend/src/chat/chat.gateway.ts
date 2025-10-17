import { Logger, ParseUUIDPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import type { MessageListResponseDto, MessageResponseDto } from './dto/message.response';
import { FetchMessagesEventDto } from './dto/fetch-messages-event.dto';
import { ReadReceiptEventDto } from './dto/read-receipt-event.dto';
import { SendMessageEventDto } from './dto/send-message-event.dto';

interface SocketUserContext {
  userId: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*'
  }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private static readonly validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    validationError: { target: false, value: false }
  });

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const userId = await this.extractUserId(client);
      const context: SocketUserContext = { userId };
      client.data.user = context;
      this.logger.debug(`Client connected: ${userId}`);
    } catch (error) {
      this.logger.warn(
        `Unauthorized client connection attempt: ${error instanceof Error ? error.message : error}`
      );
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const context = client.data.user as SocketUserContext | undefined;
    if (context) {
      this.logger.debug(`Client disconnected: ${context.userId}`);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string
  ): Promise<{ ok: boolean }> {
    const { userId } = this.getUserContext(client);
    const isParticipant = await this.chatService.isUserInRoom(roomId, userId);
    if (!isParticipant) {
      throw new WsException('Access denied');
    }

    await client.join(roomId);
    return { ok: true };
  }

  @SubscribeMessage('fetchMessages')
  @UsePipes(ChatGateway.validationPipe)
  async handleFetchMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: FetchMessagesEventDto
  ): Promise<{ ok: boolean; messages: MessageListResponseDto }> {
    const { userId } = this.getUserContext(client);
    const messages = await this.chatService.getMessages(userId, payload.roomId, {
      cursor: payload.cursor,
      limit: payload.limit
    });

    return { ok: true, messages };
  }

  @SubscribeMessage('sendMessage')
  @UsePipes(ChatGateway.validationPipe)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageEventDto
  ): Promise<{ ok: boolean; message: MessageResponseDto }> {
    const { userId } = this.getUserContext(client);
    const message = await this.chatService.sendTextMessage(userId, payload.roomId, payload.content);

    await this.server.to(payload.roomId).emit('messageCreated', message);
    return { ok: true, message };
  }

  @SubscribeMessage('markRead')
  @UsePipes(ChatGateway.validationPipe)
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReadReceiptEventDto
  ): Promise<{ ok: boolean }> {
    const { userId } = this.getUserContext(client);
    await this.chatService.markMessagesAsRead(userId, payload.roomId, payload.upToMessageId);

    await this.server.to(payload.roomId).emit('messagesRead', {
      roomId: payload.roomId,
      userId,
      upToMessageId: payload.upToMessageId ?? null
    });

    return { ok: true };
  }

  private async extractUserId(client: Socket): Promise<string> {
    const headerUserId = client.handshake.headers['x-user-id'];
    const authUserId = client.handshake.auth?.userId;
    const queryUserId = client.handshake.query?.userId;
    const rawUserId =
      (typeof headerUserId === 'string' && headerUserId) ||
      (typeof authUserId === 'string' && authUserId) ||
      (typeof queryUserId === 'string' && queryUserId);

    if (!rawUserId) {
      throw new WsException('Missing user identifier');
    }

    try {
      const pipe = new ParseUUIDPipe({ version: '4' });
      const userId = await pipe.transform(rawUserId, {
        type: 'custom',
        metatype: String,
        data: 'userId'
      });
      return userId;
    } catch {
      throw new WsException('Invalid user identifier');
    }
  }

  private getUserContext(client: Socket): SocketUserContext {
    const context = client.data.user as SocketUserContext | undefined;
    if (!context) {
      throw new WsException('Unauthorized');
    }

    return context;
  }
}
