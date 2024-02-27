import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FeedService {
  constructor(private ratingsService: RatingsService) {}

  async getFeedForUser(user: User): Promise<Rating[]> {
    const findOptionsWhere: FindOptionsWhere<Rating>[] = user.friends.map(
      (friend) => {
        return { id: friend.id };
      },
    );

    const ratings: Rating[] = await this.ratingsService.findMany({
      where: findOptionsWhere,
      order: { createdAt: 'DESC' },
    });
    return ratings;
  }
}
