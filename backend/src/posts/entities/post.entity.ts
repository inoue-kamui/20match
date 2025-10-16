export interface Post {
  id: string;
  userId: string;
  content: string;
  purposeTag: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreatePostInput {
  userId: string;
  content: string;
  purposeTag: string;
  expiresAt: Date;
}

export interface PostFilters {
  purposeTag?: string;
  prefecture?: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  cursor?: string;
  limit: number;
}
