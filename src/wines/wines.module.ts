import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wine } from './entities/wine.entity';
import { WinesController } from './wines.controller';
import { WinesService } from './wines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wine])],
  controllers: [WinesController],
  providers: [WinesService],
  exports: [WinesService],
})
export class WinesModule {}
