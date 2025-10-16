import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException
} from '@nestjs/common';

import { CreatePostDto } from './dto/create-post.dto';
import type { PostListResponseDto, PostResponseDto } from './dto/post-response.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { PostsService } from './posts.service';

const USER_ID_HEADER = 'x-user-id';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Headers(USER_ID_HEADER) rawUserId: string | undefined,
    @Body() dto: CreatePostDto
  ): Promise<PostResponseDto> {
    if (!rawUserId) {
      throw new UnauthorizedException('Missing authenticated user id');
    }

    const userId = await new ParseUUIDPipe({ version: '4' }).transform(rawUserId, {
      type: 'custom',
      metatype: String,
      data: USER_ID_HEADER
    });

    return this.postsService.createPost(userId, dto);
  }

  @Get()
  async getPosts(@Query() query: PostQueryDto): Promise<PostListResponseDto> {
    return this.postsService.getPosts(query);
  }
}
