import type { MessageType } from '../entities/message.entity';

export interface MessageResponseDto {
  id: string;
  roomId: string;
  senderId: string;
  content: string | null;
  messageType: MessageType;
  isRead: boolean;
  createdAt: Date;
}

export interface MessageListResponseDto {
  items: MessageResponseDto[];
  nextCursor?: string;
}
