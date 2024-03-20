import {
  ClassSerializerInterceptor,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { DummyDataModule } from './dummy-data/dummy-data.module';
import { FeedModule } from './feed/feed.module';
import { FriendRequestsModule } from './friend-requests/friend-requests.module';
import { RatingsModule } from './ratings/ratings.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { WinemakersModule } from './winemakers/winemakers.module';
import { WinesModule } from './wines/wines.module';
import { S3Service } from './s3/s3.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    DatabaseModule,
    WinesModule,
    WinemakersModule,
    StoresModule,
    FriendRequestsModule,
    RatingsModule,
    FeedModule,
    DummyDataModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        validationError: { target: false },
      }),
    },
    S3Service,
  ],
})
export class AppModule {}
