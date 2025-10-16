import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PostsService } from '../../src/posts/posts.service';
import { PostsRepository } from '../../src/posts/posts.repository';
import { UsersService } from '../../src/users/users.service';
import { Gender } from '../../src/users/entities/user.entity';

describe('PostsService', () => {
  let service: PostsService;
  let postsRepository: jest.Mocked<PostsRepository>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostsRepository,
          useValue: {
            createPost: jest.fn(),
            findMany: jest.fn()
          }
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn()
          }
        }
      ]
    }).compile();

    service = moduleRef.get(PostsService);
    postsRepository = moduleRef.get(PostsRepository);
    usersService = moduleRef.get(UsersService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createPost', () => {
    it('should create post when user exists', async () => {
      const now = new Date('2024-01-01T00:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      usersService.findById.mockResolvedValue({
        id: 'user-1',
        nickname: 'Alice',
        gender: Gender.Female,
        age: 25,
        prefecture: 'Tokyo',
        createdAt: now
      });

      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      postsRepository.createPost.mockImplementation(async (input) => ({
        id: 'post-1',
        userId: input.userId,
        content: input.content,
        purposeTag: input.purposeTag,
        createdAt: now,
        expiresAt
      }));

      const result = await service.createPost('user-1', {
        content: 'Looking for chat',
        purposeTag: 'casual'
      });

      expect(postsRepository.createPost).toHaveBeenCalledWith({
        userId: 'user-1',
        content: 'Looking for chat',
        purposeTag: 'casual',
        expiresAt
      });

      expect(result).toEqual({
        id: 'post-1',
        userId: 'user-1',
        content: 'Looking for chat',
        purposeTag: 'casual',
        createdAt: now,
        expiresAt
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.createPost('missing-user', { content: 'Hi', purposeTag: 'casual' })
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getPosts', () => {
    it('should throw BadRequestException when minAge greater than maxAge', async () => {
      await expect(
        service.getPosts({
          purposeTag: undefined,
          prefecture: undefined,
          gender: undefined,
          minAge: 40,
          maxAge: 30,
          cursor: undefined,
          limit: 10
        })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return posts with pagination metadata', async () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const expiresAt = new Date('2024-01-01T01:00:00Z');

      postsRepository.findMany.mockResolvedValue({
        items: [
          {
            id: 'post-1',
            userId: 'user-1',
            content: 'Looking for chat',
            purposeTag: 'casual',
            createdAt,
            expiresAt
          }
        ],
        nextCursor: 'cursor-123'
      });

      const result = await service.getPosts({
        purposeTag: 'casual',
        prefecture: 'Tokyo',
        gender: Gender.Female,
        minAge: 20,
        maxAge: 30,
        cursor: undefined,
        limit: 20
      });

      expect(postsRepository.findMany).toHaveBeenCalledWith({
        purposeTag: 'casual',
        prefecture: 'Tokyo',
        gender: Gender.Female,
        minAge: 20,
        maxAge: 30,
        cursor: undefined,
        limit: 20
      });

      expect(result).toEqual({
        items: [
          {
            id: 'post-1',
            userId: 'user-1',
            content: 'Looking for chat',
            purposeTag: 'casual',
            createdAt,
            expiresAt
          }
        ],
        nextCursor: 'cursor-123'
      });
    });
  });
});
