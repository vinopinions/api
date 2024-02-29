import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { buildPageDto } from '../pagination/pagination.utils';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FeedService {
  constructor(private ratingsService: RatingsService) {}

  async getFeedForUser(
    user: User,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    const findOptionsWhere: FindOptionsWhere<Rating>[] = user.friends.map(
      (friend) => {
        return {
          user: {
            id: friend.id,
          },
        };
      },
    );

    return await buildPageDto(
      this.ratingsService,
      paginationOptionsDto,
      findOptionsWhere,
      'createdAt',
    );
  }
}
