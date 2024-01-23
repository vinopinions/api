import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Winemaker } from './entities/winemaker.entity';

@Injectable()
export class WinemakersService {
  constructor(
    @InjectRepository(Winemaker)
    private winemakersRepository: Repository<Winemaker>,
  ) {}

  async create(name: string): Promise<Winemaker> {
    const existingWinemaker: Winemaker | null =
      await this.winemakersRepository.findOne({
        where: { name },
      });

    if (existingWinemaker !== null)
      throw new ConflictException('winemaker with that name already exists');

    const user: Winemaker = this.winemakersRepository.create({ name });
    return this.winemakersRepository.save(user);
  }

  async findOne(options: FindOneOptions<Winemaker>): Promise<Winemaker> {
    const winemaker = await this.winemakersRepository.findOne(options);
    if (!winemaker)
      throw new NotFoundException(
        `Winemaker with ${JSON.stringify(options.where)} not found`,
      );
    return winemaker;
  }

  findMany(options?: FindManyOptions<Winemaker>) {
    return this.winemakersRepository.find(options);
  }
}
