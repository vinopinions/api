import {
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
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { Store } from '../stores/entities/store.entity';
import { StoresService } from '../stores/stores.service';
import { User } from '../users/entities/user.entity';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { WinemakersService } from './../winemakers/winemakers.service';
import { Wine } from './entities/wine.entity';

@Injectable()
export class WinesService {
  constructor(
    @InjectRepository(Wine) private wineRepository: Repository<Wine>,
    @Inject(forwardRef(() => WinemakersService))
    private winemakersService: WinemakersService,
    @Inject(forwardRef(() => StoresService))
    private storesService: StoresService,
    private ratingsService: RatingsService,
  ) {}

  async create(
    name: string,
    year: number,
    winemakerId: string,
    storeIds: string[],
    grapeVariety: string,
    heritage: string,
  ): Promise<Wine> {
    const winemaker: Winemaker = await this.winemakersService.findOne({
      where: { id: winemakerId },
    });

    const stores: Store[] = await Promise.all(
      (storeIds ?? []).map(async (storeId: string) => {
        return await this.storesService.findOne({
          where: { id: storeId },
        });
      }),
    );

    const wine: Wine = this.wineRepository.create({
      name,
      year,
      grapeVariety,
      heritage,
    });
    wine.winemaker = winemaker;
    wine.stores = stores;
    const dbWine: Wine = await this.wineRepository.save(wine);
    return await this.findOne({ where: { id: dbWine.id } });
  }

  findMany(options?: FindManyOptions<Wine>) {
    return this.wineRepository.find(options);
  }

  async findOne(options: FindOneOptions<Wine>): Promise<Wine> {
    const wine = await this.wineRepository.findOne(options);
    if (!wine)
      throw new NotFoundException(
        `Wine with ${JSON.stringify(options.where)} not found`,
      );
    return wine;
  }

  async findManyPaginated(
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Wine>,
  ): Promise<PageDto<Wine>> {
    return await buildPageDto(
      this.wineRepository,
      paginationOptionsDto,
      'createdAt',
      options,
    );
  }

  async findAllPaginated(
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    return await this.findManyPaginated(paginationOptionsDto);
  }

  async findManyByStorePaginated(
    store: Store,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    return await this.findManyPaginated(paginationOptionsDto, {
      relations: ['stores'],
      where: { stores: { id: store.id } },
    });
  }

  async findManyByWinemakerPaginated(
    winemaker: Winemaker,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    return await this.findManyPaginated(paginationOptionsDto, {
      relations: ['winemaker'],
      where: { winemaker: { id: winemaker.id } },
    });
  }

  async findStoresPaginated(
    wine: Wine,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Store>> {
    return await this.storesService.findManyByWinePaginated(
      wine,
      paginationOptionsDto,
    );
  }

  async findRatingsPaginated(
    wine: Wine,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    return await this.ratingsService.findManyByWinePaginated(
      wine,
      paginationOptionsDto,
    );
  }

  async remove(id: string): Promise<Wine> {
    const wine: Wine = await this.findOne({ where: { id } });
    await this.wineRepository.remove(wine);
    return wine;
  }

  async update(wine: Wine, storeIds: string[]): Promise<Wine> {
    if (!storeIds || storeIds.length < 0) {
      wine.stores = [];
    } else {
      const stores: Store[] = await Promise.all(
        storeIds.map(async (storeId: string) => {
          const store: Store | null = await this.storesService.findOne({
            where: { id: storeId },
          });
          return store;
        }),
      );
      wine.stores = stores;
    }

    await this.wineRepository.save(wine);
    return await this.findOne({ where: { id: wine.id } });
  }

  async createRating(
    stars: number,
    text: string,
    user: User,
    wine: Wine,
  ): Promise<Rating> {
    return this.ratingsService.create(stars, text, user, wine);
  }
}
