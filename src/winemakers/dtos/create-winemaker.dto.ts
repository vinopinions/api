import { PickType } from '@nestjs/swagger';
import { Winemaker } from '../entities/winemaker.entity';

export class CreateWinemakerDto extends PickType(Winemaker, [
  'name',
] as const) {}
