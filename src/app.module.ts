import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FriendRequestsModule } from './friend-requests/friend-requests.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { WinemakersModule } from './winemakers/winemakers.module';
import { WinesModule } from './wines/wines.module';

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
  ],
})
export class AppModule {}
