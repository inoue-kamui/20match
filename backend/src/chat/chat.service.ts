import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { ChatRepository } from './chat.repository';
import type { MessageListResponseDto, MessageResponseDto } from './dto/message.response';
import { MessageQueryDto } from './dto/message-query.dto';
import { MessageType, type Message } from './entities/message.entity';

const CHAT_ACTIVE_WINDOW_SECONDS = 20 * 60;

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    return this.chatRepository.isUserInRoom(roomId, userId);
  }

  async getMessages(
    userId: string,
    roomId: string,
    query: MessageQueryDto
  ): Promise<MessageListResponseDto> {
    const isParticipant = await this.chatRepository.isUserInRoom(roomId, userId);
    if (!isParticipant) {
      throw new ForbiddenException('Access to chat room denied');
    }

    const { items, nextCursor } = await this.chatRepository.findMessagesByRoom(
      roomId,
      query.limit,
      query.cursor
    );

    return {
      items: items.map((message) => this.mapMessageToDto(message)),
      nextCursor
    };
  }

  async sendTextMessage(userId: string, roomId: string, content: string): Promise<MessageResponseDto> {
    const room = await this.chatRepository.findRoomWithParticipants(roomId);
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    const isParticipant = room.participants.some((participant) => participant.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('Access to chat room denied');
    }

    const isRoomActive =
      room.createdAt.getTime() >= Date.now() - CHAT_ACTIVE_WINDOW_SECONDS * 1000;
    if (!isRoomActive) {
      throw new ForbiddenException('Chat room has expired');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = await this.chatRepository.createMessage(roomId, userId, content.trim());
    return this.mapMessageToDto(message);
  }

  async markMessagesAsRead(
    userId: string,
    roomId: string,
    upToMessageId?: string
  ): Promise<void> {
    const isParticipant = await this.chatRepository.isUserInRoom(roomId, userId);
    if (!isParticipant) {
      throw new ForbiddenException('Access to chat room denied');
    }

    let upToCreatedAt: Date | undefined;

    if (upToMessageId) {
      const message = await this.chatRepository.findMessageById(upToMessageId);
      if (!message || message.roomId !== roomId) {
        throw new NotFoundException('Reference message not found');
      }

      upToCreatedAt = message.createdAt;
    }

    await this.chatRepository.markMessagesAsRead(roomId, userId, { upToCreatedAt });
  }

  private mapMessageToDto(message: Message): MessageResponseDto {
    return {
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType as MessageType,
      isRead: message.isRead,
      createdAt: message.createdAt
    };
  }
}
