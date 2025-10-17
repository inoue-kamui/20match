import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';

import { ChatRepository } from '../../src/chat/chat.repository';
import { ChatService } from '../../src/chat/chat.service';
import { MessageType } from '../../src/chat/entities/message.entity';

describe('ChatService', () => {
  const now = new Date();
  let repository: jest.Mocked<ChatRepository>;
  let service: ChatService;

  beforeEach(() => {
    repository = {
      isUserInRoom: jest.fn(),
      findRoomWithParticipants: jest.fn(),
      createMessage: jest.fn(),
      findMessagesByRoom: jest.fn(),
      findMessageById: jest.fn(),
      markMessagesAsRead: jest.fn()
    } as unknown as jest.Mocked<ChatRepository>;

    service = new ChatService(repository);
  });

  describe('getMessages', () => {
    it('throws when user is not a participant', async () => {
      repository.isUserInRoom.mockResolvedValue(false);

      await expect(
        service.getMessages('user-1', 'room-1', { limit: 20, cursor: undefined })
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns messages when user is a participant', async () => {
      repository.isUserInRoom.mockResolvedValue(true);
      repository.findMessagesByRoom.mockResolvedValue({
        items: [
          {
            id: 'msg-1',
            roomId: 'room-1',
            senderId: 'user-1',
            content: 'hello',
            messageType: MessageType.Text,
            isRead: false,
            createdAt: now
          }
        ],
        nextCursor: undefined
      });

      await expect(
        service.getMessages('user-1', 'room-1', { limit: 20, cursor: undefined })
      ).resolves.toEqual({
        items: [
          {
            id: 'msg-1',
            roomId: 'room-1',
            senderId: 'user-1',
            content: 'hello',
            messageType: MessageType.Text,
            isRead: false,
            createdAt: now
          }
        ],
        nextCursor: undefined
      });
    });
  });

  describe('sendTextMessage', () => {
    it('throws when room is not found', async () => {
      repository.findRoomWithParticipants.mockResolvedValue(null);

      await expect(service.sendTextMessage('user-1', 'room-1', 'hello')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('throws when user is not a participant', async () => {
      repository.findRoomWithParticipants.mockResolvedValue({
        id: 'room-1',
        matchId: 'match-1',
        createdAt: now,
        participants: [{ userId: 'other-user', user: {} }] as any
      });

      await expect(service.sendTextMessage('user-1', 'room-1', 'hello')).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('throws when room has expired', async () => {
      repository.findRoomWithParticipants.mockResolvedValue({
        id: 'room-1',
        matchId: 'match-1',
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
        participants: [{ userId: 'user-1', user: {} }] as any
      });

      await expect(service.sendTextMessage('user-1', 'room-1', 'hello')).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('throws when content is empty', async () => {
      repository.findRoomWithParticipants.mockResolvedValue({
        id: 'room-1',
        matchId: 'match-1',
        createdAt: now,
        participants: [{ userId: 'user-1', user: {} }] as any
      });

      await expect(service.sendTextMessage('user-1', 'room-1', ' ')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('creates message when input is valid', async () => {
      repository.findRoomWithParticipants.mockResolvedValue({
        id: 'room-1',
        matchId: 'match-1',
        createdAt: now,
        participants: [{ userId: 'user-1', user: {} }] as any
      });

      repository.createMessage.mockResolvedValue({
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        content: 'hello',
        messageType: MessageType.Text,
        isRead: false,
        createdAt: now
      });

      await expect(service.sendTextMessage('user-1', 'room-1', 'hello')).resolves.toEqual({
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        content: 'hello',
        messageType: MessageType.Text,
        isRead: false,
        createdAt: now
      });

      expect(repository.createMessage).toHaveBeenCalledWith('room-1', 'user-1', 'hello');
    });
  });

  describe('markMessagesAsRead', () => {
    it('throws when user is not in room', async () => {
      repository.isUserInRoom.mockResolvedValue(false);

      await expect(service.markMessagesAsRead('user-1', 'room-1')).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('throws when reference message not found', async () => {
      repository.isUserInRoom.mockResolvedValue(true);
      repository.findMessageById.mockResolvedValue(null);

      await expect(
        service.markMessagesAsRead('user-1', 'room-1', 'missing-message')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('marks messages when reference is valid', async () => {
      repository.isUserInRoom.mockResolvedValue(true);
      repository.findMessageById.mockResolvedValue({
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-2',
        content: 'hello',
        messageType: MessageType.Text,
        isRead: false,
        createdAt: now
      });

      repository.markMessagesAsRead.mockResolvedValue(1);

      await expect(
        service.markMessagesAsRead('user-1', 'room-1', 'msg-1')
      ).resolves.toBeUndefined();

      expect(repository.markMessagesAsRead).toHaveBeenCalledWith('room-1', 'user-1', {
        upToCreatedAt: now
      });
    });
  });
});
