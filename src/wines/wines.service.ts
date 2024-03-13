import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { Store } from '../stores/entities/store.entity';
import { StoresService } from '../stores/stores.service';
import { User } from '../users/entities/user.entity';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { WinemakersService } from './../winemakers/winemakers.service';
import { Wine } from './entities/wine.entity';

@Injectable()
export class WinesService extends CommonService<Wine> {
  constructor(
    @InjectRepository(Wine) private wineRepository: Repository<Wine>,
    @Inject(forwardRef(() => WinemakersService))
    private winemakersService: WinemakersService,
    @Inject(forwardRef(() => StoresService))
    private storesService: StoresService,
    private ratingsService: RatingsService,
  ) {
    super(wineRepository, Wine);
  }

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
