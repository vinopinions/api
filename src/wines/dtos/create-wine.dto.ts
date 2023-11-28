import { PickType } from '@nestjs/swagger';
import { Wine } from '../entities/wine.entity';

export class CreateWineDto extends PickType(Wine, [
  'name',
  'year',
  'grapeVariety',
  'heritage',
  'winemaker',
] as const) {}
