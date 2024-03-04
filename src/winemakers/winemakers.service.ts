import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { buildPageDto } from '../pagination/pagination.utils';
import { Wine } from '../wines/entities/wine.entity';
import { WinesService } from '../wines/wines.service';
import { Winemaker } from './entities/winemaker.entity';

@Injectable()
export class WinemakersService {
  constructor(
    @InjectRepository(Winemaker)
    private winemakersRepository: Repository<Winemaker>,
    @Inject(forwardRef(() => WinesService)) private winesService: WinesService,
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

  async findManyPaginated(
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Winemaker>,
  ): Promise<PageDto<Winemaker>> {
    return await buildPageDto(
      this.winemakersRepository,
      paginationOptionsDto,
      'createdAt',
      options,
    );
  }

  async findAllPaginated(
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Winemaker>> {
    return await this.findManyPaginated(paginationOptionsDto);
  }

  async findWinesPaginated(
    winemaker: Winemaker,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    return await this.winesService.findManyByWinemakerPaginated(
      winemaker,
      paginationOptionsDto,
    );
  }
}
