import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wine } from './entities/wine.entity';

@Injectable()
export class WinesService {
  constructor(
    @InjectRepository(Wine) private wineRepository: Repository<Wine>,
  ) {}

  async create(name: string, year: number, winemaker: string): Promise<Wine> {
    const Wine: Wine = this.wineRepository.create({ name, year, winemaker });
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
