import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Winemaker } from 'src/winemakers/entities/winemaker.entity';
import { Repository } from 'typeorm';
import { WinemakersService } from './../winemakers/winemakers.service';
import { Wine } from './entities/wine.entity';

@Injectable()
export class WinesService {
  constructor(
    @InjectRepository(Wine) private wineRepository: Repository<Wine>,
    private winemakersService: WinemakersService,
  ) {}

  async create(
    name: string,
    year: number,
    winemakerId: string,
    grapeVariety: string,
    heritage: string,
  ): Promise<Wine> {
    const winemaker: Winemaker | null =
      await this.winemakersService.find(winemakerId);

    if (!winemaker) throw new BadRequestException('Winemaker not found');

    const Wine: Wine = this.wineRepository.create({
      name,
      year,
      winemaker,
      grapeVariety,
      heritage,
    });
    return this.wineRepository.save(Wine);
  }

  findAll() {
    return this.wineRepository.find();
  }

  findOneById(id: string): Promise<Wine | null> {
    return this.wineRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<Wine> {
    const Wine: Wine | null = await this.findOneById(id);
    if (Wine === null) throw new NotFoundException();
    return this.wineRepository.remove(Wine);
  }
}
