import type { User } from '../entities/user.entity';

export interface UserResponseDto {
  id: string;
  nickname: string;
  gender: User['gender'];
  age: number;
  prefecture: string;
  createdAt: Date;
}

export const toUserResponseDto = (user: User): UserResponseDto => ({
  id: user.id,
  nickname: user.nickname,
  gender: user.gender,
  age: user.age,
  prefecture: user.prefecture,
  createdAt: user.createdAt
});
