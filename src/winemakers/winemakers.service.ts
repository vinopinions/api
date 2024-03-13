import {
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { Wine } from '../wines/entities/wine.entity';
import { WinesService } from '../wines/wines.service';
import { Winemaker } from './entities/winemaker.entity';

@Injectable()
export class WinemakersService extends CommonService<Winemaker> {
  constructor(
    @InjectRepository(Winemaker)
    private winemakersRepository: Repository<Winemaker>,
    @Inject(forwardRef(() => WinesService)) private winesService: WinesService,
  ) {
    super(winemakersRepository, Winemaker);
  }

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
