import { Injectable } from '@nestjs/common';
import type { Match as PrismaMatch, ChatRoom as PrismaChatRoom, RoomParticipant } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import {
  type ApproveMatchResult,
  type ChatRoom,
  type CreateMatchInput,
  type Match,
  MatchStatus
} from './entities/match.entity';

@Injectable()
export class MatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByPostAndApplicant(postId: string, applicantId: string): Promise<Match | null> {
    const record = await this.prisma.match.findFirst({
      where: {
        postId,
        applicantId,
        status: {
          in: [MatchStatus.Pending, MatchStatus.Approved]
        }
      }
    });

    return record ? this.mapMatch(record) : null;
  }

  async createMatch(input: CreateMatchInput): Promise<Match> {
    const record = await this.prisma.match.create({
      data: {
        postId: input.postId,
        applicantId: input.applicantId,
        status: MatchStatus.Pending,
        expiresAt: input.expiresAt
      }
    });

    return this.mapMatch(record);
  }

  async findByIdWithPost(matchId: string): Promise<(Match & { postUserId: string }) | null> {
    const record = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { post: { select: { userId: true } } }
    });

    if (!record) {
      return null;
    }

    return {
      ...this.mapMatch(record),
      postUserId: record.post.userId
    };
  }

  async approveMatch(
    matchId: string,
    postOwnerId: string,
    applicantId: string
  ): Promise<ApproveMatchResult> {
    return this.prisma.$transaction(async (tx) => {
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: { status: MatchStatus.Approved }
      });

      const chatRoomRecord = await tx.chatRoom.create({
        data: { matchId }
      });

      const participantRecords: RoomParticipant[] = [];

      participantRecords.push(
        await tx.roomParticipant.create({
          data: {
            roomId: chatRoomRecord.id,
            userId: postOwnerId
          }
        })
      );

      participantRecords.push(
        await tx.roomParticipant.create({
          data: {
            roomId: chatRoomRecord.id,
            userId: applicantId
          }
        })
      );

      return {
        match: this.mapMatch(updatedMatch),
        chatRoom: this.mapChatRoom(chatRoomRecord),
        participants: participantRecords.map((participant) => ({
          id: participant.id,
          roomId: participant.roomId,
          userId: participant.userId,
          createdAt: participant.createdAt
        }))
      };
    });
  }

  private mapMatch(record: PrismaMatch): Match {
    return {
      id: record.id,
      postId: record.postId,
      applicantId: record.applicantId,
      status: record.status as MatchStatus,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt
    };
  }

  private mapChatRoom(record: PrismaChatRoom): ChatRoom {
    return {
      id: record.id,
      matchId: record.matchId,
      createdAt: record.createdAt
    };
  }
}
