import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Repository } from 'typeorm';
import { WinesService } from '../wines/wines.service';
import { Wine } from '../wines/entities/wine.entity';
import { validate } from 'class-validator';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    private wineService: WinesService,
    private usersService: UsersService,
  ) {}

  async create(data: CreateRatingDto): Promise<Rating> {
    const wine: Wine | null = await this.wineService.findOneById(data.wineId);
    const user: User | null = await this.usersService.findOneById(data.userId);

    const rating: Rating = this.ratingRepository.create(data);
    rating.wine = wine;
    rating.user = user;

    const validationErrors = await validate(rating);
    if (validationErrors.length > 0)
      throw new BadRequestException(validationErrors.map((e) => e.constraints));
    return this.ratingRepository.save(rating);
  }

  findAll() {
    return this.ratingRepository.find();
  }

  async findOneById(id: string): Promise<Rating> {
    const rating: Rating | null = await this.ratingRepository.findOne({
      where: { id },
      join: {
        alias: 'rating',
        leftJoinAndSelect: {
          wine: 'rating.wine',
          user: 'rating.user',
        },
      },
    });
    if (!rating) throw new NotFoundException('Rating not found');
    return rating;
  }

  async remove(id: string): Promise<Rating> {
    const rating: Rating = await this.findOneById(id);
    return this.ratingRepository.remove(rating);
  }

  async getByWineId(id: string): Promise<Rating[]> {
    const wine: Wine = await this.wineService.findOneById(id);
    return wine.ratings;
  }
}
