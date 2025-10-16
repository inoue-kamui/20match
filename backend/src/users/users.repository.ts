import { Injectable } from '@nestjs/common';
import type { User as PrismaUser } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import type { CreateUserInput, User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserInput): Promise<User> {
    const created = await this.prisma.user.create({ data });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { id } });
    return found ? this.mapToDomain(found) : null;
  }

  private mapToDomain(record: PrismaUser): User {
    return {
      id: record.id,
      nickname: record.nickname,
      gender: record.gender as User['gender'],
      age: record.age,
      prefecture: record.prefecture,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
