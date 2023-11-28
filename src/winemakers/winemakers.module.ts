import { Module } from '@nestjs/common';
import { WinemakersService } from './winemakers.service';
import { WinemakersController } from './winemakers.controller';

@Module({
  providers: [WinemakersService],
  controllers: [WinemakersController]
})
export class WinemakersModule {}
