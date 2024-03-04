import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinesModule } from '../wines/wines.module';
import { Winemaker } from './entities/winemaker.entity';
import { WinemakersController } from './winemakers.controller';
import { WinemakersService } from './winemakers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Winemaker]),
    forwardRef(() => WinesModule),
  ],
  providers: [WinemakersService],
  controllers: [WinemakersController],
  exports: [WinemakersService],
})
export class WinemakersModule {}
