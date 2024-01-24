import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wine } from './entities/wine.entity';
import { WinesController } from './wines.controller';
import { WinesService } from './wines.service';
import { Store } from '../stores/entities/store.entity';
import { StoresModule } from '../stores/stores.module';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { WinemakersModule } from '../winemakers/winemakers.module';
import { Rating } from '../ratings/entities/rating.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { RatingsModule } from '../ratings/ratings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wine, Winemaker, Store, Rating, User]),
    WinemakersModule,
    StoresModule,
    UsersModule,
    RatingsModule,
  ],
  controllers: [WinesController],
  providers: [WinesService],
  exports: [WinesService],
})
export class WinesModule {}
