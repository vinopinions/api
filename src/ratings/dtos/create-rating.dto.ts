import { PickType } from '@nestjs/swagger';
import { Rating } from '../entities/rating.entity';
import { IsUUID } from 'class-validator';

export class CreateRatingDto extends PickType(Rating, [
  'stars',
  'text',
] as const) {
  @IsUUID()
  wineId: string;
  @IsUUID()
  userId: string;
}
