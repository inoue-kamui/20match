import { Injectable } from '@nestjs/common';
import type { Post as PrismaPost, Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import type { CreatePostInput, Post, PostFilters } from './entities/post.entity';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(input: CreatePostInput): Promise<Post> {
    const created = await this.prisma.post.create({
      data: {
        userId: input.userId,
        content: input.content,
        purposeTag: input.purposeTag,
        expiresAt: input.expiresAt
      }
    });

    return this.mapToDomain(created);
  }

  async findMany(filters: PostFilters): Promise<{ items: Post[]; nextCursor?: string }> {
    const where = this.buildWhereClause(filters);
    const take = filters.limit + 1;

    const records = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      ...(filters.cursor
        ? {
            cursor: { id: filters.cursor },
            skip: 1
          }
        : {})
    });

    const hasNextPage = records.length === take;
    const items = (hasNextPage ? records.slice(0, -1) : records).map((record) => this.mapToDomain(record));
    const nextCursor = hasNextPage ? records[records.length - 1]?.id : undefined;

    return { items, nextCursor };
  }

  private buildWhereClause(filters: PostFilters): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {};

    if (filters.purposeTag) {
      where.purposeTag = filters.purposeTag;
    }

    const userConditions: Prisma.UserWhereInput = {};

    if (filters.prefecture) {
      userConditions.prefecture = filters.prefecture;
    }

    if (filters.gender) {
      userConditions.gender = filters.gender;
    }

    if (filters.minAge || filters.maxAge) {
      userConditions.age = {
        gte: filters.minAge,
        lte: filters.maxAge
      };
    }

    if (Object.keys(userConditions).length > 0) {
      where.user = userConditions;
    }

    return where;
  }

  private mapToDomain(record: PrismaPost): Post {
    return {
      id: record.id,
      userId: record.userId,
      content: record.content,
      purposeTag: record.purposeTag,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt
    };
  }
}
