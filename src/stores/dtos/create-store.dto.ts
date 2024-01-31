import { ApiProperty, PickType } from '@nestjs/swagger';
import { Store } from '../entities/store.entity';

export class CreateStoreDto extends PickType(Store, [
  'name',
  'address',
  'url',
] as const) {}
