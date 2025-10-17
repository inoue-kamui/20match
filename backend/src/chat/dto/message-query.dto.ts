import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsUUID, Max } from 'class-validator';

export class MessageQueryDto {
  @IsOptional()
  @IsUUID('4')
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 50))
  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 50;
}
