import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { MatchesModule } from './matches/matches.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, UsersModule, PostsModule, MatchesModule]
})
export class AppModule {}
