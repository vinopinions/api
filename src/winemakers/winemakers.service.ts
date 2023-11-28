import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Winemaker } from './entities/winemaker.entity';

@Injectable()
export class WinemakersService {
  constructor(
    @InjectRepository(Winemaker)
    private winemakerRepository: Repository<Winemaker>,
  ) {}

  async create(name: string): Promise<Winemaker> {
    const existingWinemaker: Winemaker | null =
      await this.winemakerRepository.findOne({
        where: { name },
      });

    if (existingWinemaker !== null)
      throw new ConflictException('winemaker with that name already exists');

    const user: Winemaker = this.winemakerRepository.create({ name });
    return this.winemakerRepository.save(user);
  }
}
