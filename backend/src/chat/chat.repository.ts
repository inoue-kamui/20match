import { Injectable } from '@nestjs/common';
import type {
  ChatRoom as PrismaChatRoom,
  Message as PrismaMessage,
  Prisma,
  RoomParticipant as PrismaRoomParticipant,
  User
} from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { MessageType, type Message } from './entities/message.entity';

type ChatRoomWithParticipants = PrismaChatRoom & {
  participants: (PrismaRoomParticipant & { user: User })[];
};

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.roomParticipant.count({
      where: { roomId, userId }
    });

    return count > 0;
  }

  async findRoomWithParticipants(roomId: string): Promise<ChatRoomWithParticipants | null> {
    return this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async createMessage(roomId: string, senderId: string, content: string): Promise<Message> {
    const record = await this.prisma.message.create({
      data: {
        roomId,
        senderId,
        content,
        messageType: MessageType.Text
      }
    });

    return this.mapMessage(record);
  }

  async findMessageById(messageId: string): Promise<Message | null> {
    const record = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    return record ? this.mapMessage(record) : null;
  }

  async findMessagesByRoom(
    roomId: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: Message[]; nextCursor?: string }> {
    const take = limit + 1;

    const records = await this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1
          }
        : {})
    });

    const hasMore = records.length === take;
    const sliced = hasMore ? records.slice(0, -1) : records;

    return {
      items: sliced.map((record) => this.mapMessage(record)).reverse(),
      nextCursor: hasMore ? records[records.length - 1]?.id : undefined
    };
  }

  async markMessagesAsRead(
    roomId: string,
    userId: string,
    options: { upToCreatedAt?: Date } = {}
  ): Promise<number> {
    const where: Prisma.MessageWhereInput = {
      roomId,
      senderId: {
        not: userId
      },
      isRead: false
    };

    if (options.upToCreatedAt) {
      where.createdAt = {
        lte: options.upToCreatedAt
      };
    }

    const result = await this.prisma.message.updateMany({
      where,
      data: {
        isRead: true
      }
    });

    return result.count;
  }

  private mapMessage(record: PrismaMessage): Message {
    return {
      id: record.id,
      roomId: record.roomId,
      senderId: record.senderId,
      content: record.content,
      messageType: record.messageType as MessageType,
      isRead: record.isRead,
      createdAt: record.createdAt
    };
  }
}
