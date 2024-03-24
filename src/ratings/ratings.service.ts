import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { S3Service } from '../s3/s3.service';
import { User } from '../users/entities/user.entity';
import { Wine } from '../wines/entities/wine.entity';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService extends CommonService<Rating> {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    private s3Service: S3Service,
  ) {
    super(ratingRepository, Rating, async (rating: Rating) => {
      if (await this.s3Service.existsImage(rating.wine.id, 'wine'))
        rating.wine.image = await this.s3Service.getSignedImageUrl(
          rating.wine.id,
          'wine',
        );
      return rating;
    });
  }

  async create(
    stars: number,
    text: string,
    user: User,
    wine: Wine,
  ): Promise<Rating> {
    const rating: Rating = this.ratingRepository.create({ stars, text });
    rating.wine = wine;
    rating.user = user;

    const dbRating: Rating = await this.ratingRepository.save(rating);
    const newRating = await this.findOne({
      where: {
        id: dbRating.id,
      },
    });
    return newRating;
  }

  async findManyByUserPaginated(
    user: User,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    return await this.findManyPaginated(paginationOptionsDto, {
      relations: ['user'],
      where: { user: { id: user.id } },
    });
  }

  async findManyByWinePaginated(
    wine: Wine,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    return await this.findManyPaginated(paginationOptionsDto, {
      relations: ['wine'],
      where: { wine: { id: wine.id } },
    });
  }

  async remove(id: string): Promise<Rating> {
    const rating: Rating = await this.findOne({
      where: {
        id,
      },
    });
    await this.ratingRepository.remove(rating);
    return rating;
  }
}
