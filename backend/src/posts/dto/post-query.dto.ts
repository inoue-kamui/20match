import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min
} from 'class-validator';

import { Gender } from '../../users/entities/user.entity';

export class PostQueryDto {
  @IsOptional()
  @IsString()
  purposeTag?: string;

  @IsOptional()
  @IsString()
  prefecture?: string;

  @IsOptional()
  @IsIn([Gender.Male, Gender.Female])
  gender?: Gender;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(18)
  @Max(90)
  minAge?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(18)
  @Max(90)
  maxAge?: number;

  @IsOptional()
  @IsUUID('4')
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 20;
}
