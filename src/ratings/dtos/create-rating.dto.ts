import { PickType } from '@nestjs/swagger';
import { Rating } from '../entities/rating.entity';
import { IsNotEmpty } from 'class-validator';

export class CreateRatingDto extends PickType(Rating, [
  'stars',
  'text',
] as const) {
  @IsNotEmpty()
  wineId: string;
}
