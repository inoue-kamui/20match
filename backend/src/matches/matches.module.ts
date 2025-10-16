import { Module } from '@nestjs/common';

import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { MatchesController } from './matches.controller';
import { MatchesRepository } from './matches.repository';
import { MatchesService } from './matches.service';

@Module({
  imports: [UsersModule, PostsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchesRepository],
  exports: [MatchesService]
})
export class MatchesModule {}
