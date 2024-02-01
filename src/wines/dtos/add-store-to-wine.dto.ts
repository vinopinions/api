import { ApiProperty } from '@nestjs/swagger';

export class AddStoreToWineDto {
  @ApiProperty({
    example: '[uuid]',
    description: 'the ids of the stores',
    type: Array,
  })
  storeIds: string[];
}
