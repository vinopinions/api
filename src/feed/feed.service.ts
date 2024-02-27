import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { PageMetaDto } from '../pagination/page-meta.dto';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
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
    const itemCount = await this.ratingsService.count({
      where: findOptionsWhere,
    });
    console.log({ paginationOptionsDto });
    const ratings: Rating[] = await this.ratingsService.findMany({
      where: findOptionsWhere,
      order: {
        createdAt: paginationOptionsDto.order,
      },
      skip: paginationOptionsDto.skip,
      take: paginationOptionsDto.take,
    });
    console.log(ratings);

    const pageMetaDto = new PageMetaDto({ itemCount, paginationOptionsDto });

    return new PageDto(ratings, pageMetaDto);
  }
}
