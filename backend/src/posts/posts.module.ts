import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  imports: [UsersModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsService]
})
export class PostsModule {}
