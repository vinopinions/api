import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { buildPageDto } from '../pagination/pagination.utils';
import { User } from '../users/entities/user.entity';
import { Wine } from '../wines/entities/wine.entity';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
  ) {}

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

  findMany(options?: FindManyOptions<Rating>): Promise<Rating[]> {
    return this.ratingRepository.find(options);
  }

  async findManyPaginated(
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Rating>,
  ): Promise<PageDto<Rating>> {
    return await buildPageDto(
      this.ratingRepository,
      paginationOptionsDto,
      'createdAt',
      options,
    );
  }

  async findAllPaginated(
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    return await this.findManyPaginated(paginationOptionsDto);
  }

  async findOne(options: FindOneOptions<Rating>): Promise<Rating> {
    const rating = await this.ratingRepository.findOne(options);
    if (!rating)
      throw new NotFoundException(
        `Rating with ${JSON.stringify(options.where)} not found`,
      );
    return rating;
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
