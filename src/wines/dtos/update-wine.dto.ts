import { ApiProperty, PickType } from '@nestjs/swagger';
import { Wine } from '../entities/wine.entity';

export class AddStoreToWineDto extends PickType(Wine, ['stores'] as const) {
  @ApiProperty({
    example: '[uuid]',
    description: 'the ids of the stores',
    type: Array,
  })
  storeIds: string[];
}
