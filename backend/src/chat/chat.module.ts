import { Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  providers: [ChatService, ChatRepository, ChatGateway],
  exports: [ChatService]
})
export class ChatModule {}
