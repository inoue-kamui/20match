import { Test } from '@nestjs/testing';

import { UsersService } from '../../src/users/users.service';
import { UsersRepository } from '../../src/users/users.repository';
import { Gender } from '../../src/users/entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            createUser: jest.fn(),
            findById: jest.fn()
          }
        }
      ]
    }).compile();

    service = moduleRef.get(UsersService);
    usersRepository = moduleRef.get(UsersRepository);
  });

  describe('createUser', () => {
    it('should create a user and return response dto', async () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      usersRepository.createUser.mockResolvedValue({
        id: 'user-1',
        nickname: 'Alice',
        gender: Gender.Female,
        age: 25,
        prefecture: 'Tokyo',
        createdAt,
        updatedAt: createdAt
      });

      const result = await service.createUser({
        nickname: 'Alice',
        gender: Gender.Female,
        age: 25,
        prefecture: 'Tokyo'
      });

      expect(result).toEqual({
        id: 'user-1',
        nickname: 'Alice',
        gender: Gender.Female,
        age: 25,
        prefecture: 'Tokyo',
        createdAt
      });

      expect(usersRepository.createUser).toHaveBeenCalledWith({
        nickname: 'Alice',
        gender: Gender.Female,
        age: 25,
        prefecture: 'Tokyo'
      });
    });
  });

  describe('findById', () => {
    it('should return user response dto when found', async () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      usersRepository.findById.mockResolvedValue({
        id: 'user-1',
        nickname: 'Alice',
        gender: Gender.Female,
        age: 25,
        prefecture: 'Tokyo',
        createdAt,
        updatedAt: createdAt
      });

      await expect(service.findById('user-1')).resolves.toEqual({
        id: 'user-1',
        nickname: 'Alice',
        gender: Gender.Female,
        age: 25,
        prefecture: 'Tokyo',
        createdAt
      });
    });

    it('should return null when user is not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.findById('user-404')).resolves.toBeNull();
    });
  });
});
