import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageEventDto {
  @IsUUID('4')
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content!: string;
}
