import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { CreatePostDto } from './dto/create-post.dto';
import type { PostListResponseDto, PostResponseDto } from './dto/post-response.dto';
import { toPostResponseDto } from './dto/post-response.dto';
import { PostQueryDto } from './dto/post-query.dto';
import type { PostFilters } from './entities/post.entity';
import { PostsRepository } from './posts.repository';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly usersService: UsersService
  ) {}

  async createPost(userId: string, dto: CreatePostDto): Promise<PostResponseDto> {
    await this.ensureUserExists(userId);

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL
    const createdPost = await this.postsRepository.createPost({
      userId,
      content: dto.content,
      purposeTag: dto.purposeTag,
      expiresAt
    });

    return toPostResponseDto(createdPost);
  }

  async getPosts(query: PostQueryDto): Promise<PostListResponseDto> {
    if (query.minAge && query.maxAge && query.minAge > query.maxAge) {
      throw new BadRequestException('minAge must be less than or equal to maxAge');
    }

    const filters: PostFilters = {
      purposeTag: query.purposeTag,
      prefecture: query.prefecture,
      gender: query.gender,
      minAge: query.minAge,
      maxAge: query.maxAge,
      cursor: query.cursor,
      limit: query.limit ?? 20
    };

    const { items, nextCursor } = await this.postsRepository.findMany(filters);

    return {
      items: items.map((item) => toPostResponseDto(item)),
      nextCursor
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async findPostById(postId: string): Promise<PostResponseDto | null> {
    const post = await this.postsRepository.findById(postId);
    return post ? toPostResponseDto(post) : null;
  }
}
