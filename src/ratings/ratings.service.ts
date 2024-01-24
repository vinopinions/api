import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Wine } from '../wines/entities/wine.entity';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
  ) {}

  async create(data: CreateRatingDto, user: User, wine: Wine): Promise<Rating> {
    const rating: Rating = this.ratingRepository.create(data);
    rating.wine = wine;
    rating.user = user;

    const validationErrors = await validate(rating);
    if (validationErrors.length > 0)
      throw new BadRequestException(validationErrors.map((e) => e.constraints));
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
    return this.ratingRepository.remove(rating);
  }
}
