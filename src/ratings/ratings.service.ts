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

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    private wineService: WinesService,
  ) {}

  async create(data: { text: string; wineId: string }): Promise<Rating> {
    const wine: Wine | null = await this.wineService.findOneById(data.wineId);

    if (!wine) throw new BadRequestException('Wine not found');

    const rating: Rating = this.ratingRepository.create(data);
    rating.wine = wine;
    return this.ratingRepository.save(rating);
  }

  findAll() {
    return this.ratingRepository.find();
  }

  findOneById(id: string): Promise<Rating | null> {
    return this.ratingRepository.findOne({
      where: { id },
      relations: {
        wine: true,
      },
    });
  }

  async remove(id: string): Promise<Rating> {
    const rating: Rating | null = await this.findOneById(id);
    if (rating === null) throw new NotFoundException();
    return this.ratingRepository.remove(rating);
  }
}
