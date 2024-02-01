import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';
import { Wine } from '../entities/wine.entity';

export class CreateWineDto extends PickType(Wine, [
  'name',
  'year',
  'grapeVariety',
  'heritage',
] as const) {
  @IsUUID()
  @ApiProperty({
    example: 'uuid',
    description: 'the id of the winemaker',
    type: String,
  })
  winemakerId: string;

  @ApiProperty({
    example: '[uuid]',
    description: 'the ids of the stores',
    type: Array,
  })
  @IsArray()
  @IsUUID()
  storeIds: string[];
}
