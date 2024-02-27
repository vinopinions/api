import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
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

    return this.ratingRepository.save(rating);
  }

  findMany(options?: FindManyOptions<Rating>) {
    return this.ratingRepository.find(options);
  }

  async findOne(options: FindOneOptions<Rating>): Promise<Rating> {
    const Rating = await this.ratingRepository.findOne(options);
    if (!Rating)
      throw new NotFoundException(
        `Rating with ${JSON.stringify(options.where)} not found`,
      );
    return Rating;
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
  async count(options: FindManyOptions<Rating>): Promise<number> {
    return await this.ratingRepository.count(options);
  }

