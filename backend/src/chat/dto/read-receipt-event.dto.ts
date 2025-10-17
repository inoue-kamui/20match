import { IsOptional, IsUUID } from 'class-validator';

export class ReadReceiptEventDto {
  @IsUUID('4')
  roomId!: string;

  @IsOptional()
  @IsUUID('4')
  upToMessageId?: string;
}
