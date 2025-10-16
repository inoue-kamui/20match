import type { Post } from '../entities/post.entity';

export interface PostResponseDto {
  id: string;
  userId: string;
  content: string;
  purposeTag: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface PostListResponseDto {
  items: PostResponseDto[];
  nextCursor?: string;
}

export const toPostResponseDto = (post: Post): PostResponseDto => ({
  id: post.id,
  userId: post.userId,
  content: post.content,
  purposeTag: post.purposeTag,
  createdAt: post.createdAt,
  expiresAt: post.expiresAt
});
