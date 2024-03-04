import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class FeedService {
  constructor(
    private ratingsService: RatingsService,
    private usersService: UsersService,
  ) {}

  async getFeedForUser(
    user: User,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    // load relations
    user = await this.usersService.findOne({
      where: {
        id: user.id,
      },
      relations: ['friends'],
    });
    const findOptionsWhere: FindOptionsWhere<Rating>[] = user.friends.map(
      (friend) => {
        return {
          user: {
            id: friend.id,
          },
        };
      },
    );

    return await this.ratingsService.findManyPaginated(paginationOptionsDto, {
      where: findOptionsWhere,
    });
  }
}
