import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { loadAppConfig } from './configuration';
import { validateEnv } from './validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [loadAppConfig],
      validate: validateEnv
    })
  ]
})
export class AppConfigModule {}
