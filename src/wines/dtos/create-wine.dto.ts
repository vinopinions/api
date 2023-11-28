import { ApiProperty, PickType } from '@nestjs/swagger';
import { Wine } from '../entities/wine.entity';

export class CreateWineDto extends PickType(Wine, [
  'name',
  'year',
  'grapeVariety',
  'heritage',
] as const) {
  @ApiProperty({
    example: 'uuid',
    description: 'the id of the winemaker',
    type: String,
  })
  winemakerId: string;
}
