import { Module } from '@nestjs/common';
import { DummyDataService } from './dummy-data.service';

@Module({
  providers: [DummyDataService],
})
export class DummyDataModule {}
