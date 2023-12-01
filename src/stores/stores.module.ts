import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { Wine } from 'src/wines/entities/wine.entity';
import { WinesModule } from 'src/wines/wines.module';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { WinesService } from 'src/wines/wines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Wine]), WinesModule],
  controllers: [StoresController],
  providers: [StoresService, WinesService],
  exports: [StoresService],
})
export class StoresModule {}
