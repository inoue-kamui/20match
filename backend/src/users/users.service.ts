import { Injectable } from '@nestjs/common';

import type { CreateUserDto } from './dto/create-user.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import { toUserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const createdUser = await this.usersRepository.createUser(dto);
    return toUserResponseDto(createdUser);
  }

  async findById(userId: string): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findById(userId);
    return user ? toUserResponseDto(user) : null;
  }
}
