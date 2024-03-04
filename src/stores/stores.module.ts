import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinesModule } from '../wines/wines.module';
import { Store } from './entities/store.entity';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
@Module({
  imports: [TypeOrmModule.forFeature([Store]), forwardRef(() => WinesModule)],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
