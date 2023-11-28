import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Winemaker } from './entities/winemaker.entity';
import { WinemakersController } from './winemakers.controller';
import { WinemakersService } from './winemakers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Winemaker])],
  providers: [WinemakersService],
  controllers: [WinemakersController],
  exports: [WinemakersService],
})
export class WinemakersModule {}
