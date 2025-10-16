export enum MatchStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

export interface Match {
  id: string;
  postId: string;
  applicantId: string;
  status: MatchStatus;
  createdAt: Date;
  expiresAt: Date;
}

export interface ChatRoom {
  id: string;
  matchId: string;
  createdAt: Date;
}

export interface CreateMatchInput {
  postId: string;
  applicantId: string;
  expiresAt: Date;
}

export interface ApproveMatchResult {
  match: Match;
  chatRoom: ChatRoom;
  participants: { id: string; roomId: string; userId: string; createdAt: Date }[];
}
