import { PickType } from '@nestjs/swagger';
import { Wine } from '../entities/wine.entity';

export class CreateWineDto extends PickType(Wine, [
  'name',
  'year',
  'winemaker',
] as const) {}
