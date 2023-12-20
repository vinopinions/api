import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Winemaker } from 'src/winemakers/entities/winemaker.entity';
import { WinemakersModule } from 'src/winemakers/winemakers.module';
import { WinemakersService } from 'src/winemakers/winemakers.service';
import { Wine } from './entities/wine.entity';
import { WinesController } from './wines.controller';
import { WinesService } from './wines.service';
import { Store } from 'src/stores/entities/store.entity';
import { StoresService } from 'src/stores/stores.service';
import { StoresModule } from 'src/stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wine, Winemaker, Store]),
    WinemakersModule,
    StoresModule,
  ],
  controllers: [WinesController],
  providers: [WinesService, WinemakersService, StoresService],
  exports: [WinesService],
})
export class WinesModule {}
