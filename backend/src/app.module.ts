import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, UsersModule, PostsModule]
})
export class AppModule {}
