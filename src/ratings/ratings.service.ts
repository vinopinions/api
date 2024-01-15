import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Wine } from '../wines/entities/wine.entity';
import { WinesService } from '../wines/wines.service';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    private wineService: WinesService,
    private usersService: UsersService,
  ) {}

  async create(data: CreateRatingDto): Promise<Rating> {
    const wine: Wine = await this.wineService.findOne({
      where: {
        id: data.wineId,
      },
    });
    const user: User = await this.usersService.findOne({
      where: {
        id: data.userId,
      },
    });

    const rating: Rating = this.ratingRepository.create(data);
    rating.wine = wine;
    rating.user = user;

    const validationErrors = await validate(rating);
    if (validationErrors.length > 0)
      throw new BadRequestException(validationErrors.map((e) => e.constraints));
    return this.ratingRepository.save(rating);
  }

  findAll(options?: FindManyOptions<Rating>) {
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

  async getByWineId(id: string): Promise<Rating[]> {
    const wine: Wine = await this.wineService.findOne({ where: { id } });
    return wine.ratings;
  }
}
