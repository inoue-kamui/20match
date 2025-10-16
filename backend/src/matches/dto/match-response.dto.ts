import type { ChatRoom, Match, MatchStatus } from '../entities/match.entity';

export interface MatchResponseDto {
  id: string;
  postId: string;
  applicantId: string;
  status: MatchStatus;
  createdAt: Date;
  expiresAt: Date;
}

export interface ApproveMatchResponseDto {
  match: MatchResponseDto;
  chatRoom: ChatRoomResponseDto;
}

export interface ChatRoomResponseDto {
  id: string;
  matchId: string;
  createdAt: Date;
}

export const toMatchResponseDto = (match: Match): MatchResponseDto => ({
  id: match.id,
  postId: match.postId,
  applicantId: match.applicantId,
  status: match.status,
  createdAt: match.createdAt,
  expiresAt: match.expiresAt
});

export const toChatRoomResponseDto = (chatRoom: ChatRoom): ChatRoomResponseDto => ({
  id: chatRoom.id,
  matchId: chatRoom.matchId,
  createdAt: chatRoom.createdAt
});
