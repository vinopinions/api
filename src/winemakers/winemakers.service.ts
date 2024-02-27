import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Winemaker, WinemakerRelations } from './entities/winemaker.entity';

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
    const dbWinemaker: Winemaker = await this.winemakersRepository.save(user);
    return await this.findOne({ where: { id: dbWinemaker.id } });
  }

  async findOne(options: FindOneOptions<Winemaker>): Promise<Winemaker> {
    const winemaker = await this.winemakersRepository.findOne({
      relations: Object.fromEntries(
        WinemakerRelations.map((key) => [key, true]),
      ),
      ...options,
    });
    if (!winemaker)
      throw new NotFoundException(
        `Winemaker with ${JSON.stringify(options.where)} not found`,
      );
    return winemaker;
  }

  findMany(options?: FindManyOptions<Winemaker>) {
    return this.winemakersRepository.find({
      relations: Object.fromEntries(
        WinemakerRelations.map((key) => [key, true]),
      ),
      ...options,
    });
  }
}
