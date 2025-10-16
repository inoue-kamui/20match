import { IsEnum, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

import { Gender } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nickname!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsInt()
  @Min(18)
  @Max(90)
  age!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  prefecture!: string;
}
