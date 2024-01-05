import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Wine } from '../wines/entities/wine.entity';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { Store } from '../stores/entities/store.entity';
import { WinesModule } from '../wines/wines.module';
import { WinemakersModule } from '../winemakers/winemakers.module';
import { StoresModule } from '../stores/stores.module';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { WinesService } from '../wines/wines.service';
import { WinemakersService } from '../winemakers/winemakers.service';
import { StoresService } from '../stores/stores.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, Wine, Winemaker, Store, User]),
    WinesModule,
    WinemakersModule,
    StoresModule,
    UsersModule,
  ],
  controllers: [RatingsController],
  providers: [
    RatingsService,
    WinesService,
    WinemakersService,
    StoresService,
    UsersService,
  ],
  exports: [RatingsService],
})
export class RatingsModule {}
