import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wine } from './entities/wine.entity';
import { WinesController } from './wines.controller';
import { WinesService } from './wines.service';
import { Store } from '../stores/entities/store.entity';
import { StoresModule } from '../stores/stores.module';
import { StoresService } from '../stores/stores.service';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { WinemakersModule } from '../winemakers/winemakers.module';
import { WinemakersService } from '../winemakers/winemakers.service';
import { RatingsService } from '../ratings/ratings.service';
import { Rating } from '../ratings/entities/rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wine, Winemaker, Store, Rating]),
    WinemakersModule,
    StoresModule,
  ],
  controllers: [WinesController],
  providers: [WinesService, WinemakersService, StoresService, RatingsService],
  exports: [WinesService],
})
export class WinesModule {}
