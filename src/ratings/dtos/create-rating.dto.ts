import { PickType } from '@nestjs/swagger';
import { Rating } from '../entities/rating.entity';

export class CreateRatingDto extends PickType(Rating, ['text'] as const) {
  wineId: string;
}
