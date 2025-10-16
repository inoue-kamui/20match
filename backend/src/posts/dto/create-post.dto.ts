import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  content!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  purposeTag!: string;
}
