import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Winemaker } from 'src/winemakers/entities/winemaker.entity';
import { WinemakersModule } from 'src/winemakers/winemakers.module';
import { WinemakersService } from 'src/winemakers/winemakers.service';
import { Wine } from './entities/wine.entity';
import { WinesController } from './wines.controller';
import { WinesService } from './wines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wine, Winemaker]), WinemakersModule],
  controllers: [WinesController],
  providers: [WinesService, WinemakersService],
  exports: [WinesService],
})
export class WinesModule {}
