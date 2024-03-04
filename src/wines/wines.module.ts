import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsModule } from '../ratings/ratings.module';
import { StoresModule } from '../stores/stores.module';
import { WinemakersModule } from '../winemakers/winemakers.module';
import { Wine } from './entities/wine.entity';
import { WinesController } from './wines.controller';
import { WinesService } from './wines.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wine]),
    forwardRef(() => WinemakersModule),
    forwardRef(() => StoresModule),
    RatingsModule,
  ],
  controllers: [WinesController],
  providers: [WinesService],
  exports: [WinesService],
})
export class WinesModule {}
