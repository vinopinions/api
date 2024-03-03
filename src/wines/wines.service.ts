import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { buildPageDto } from '../pagination/pagination.utils';
import { Store } from '../stores/entities/store.entity';
import { StoresService } from '../stores/stores.service';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { WinemakersService } from './../winemakers/winemakers.service';
import { Wine, WineRelations } from './entities/wine.entity';

@Injectable()
export class WinesService {
  constructor(
    @InjectRepository(Wine) private wineRepository: Repository<Wine>,
    private winemakersService: WinemakersService,
    private storesService: StoresService,
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
    return this.wineRepository.find({
      relations: Object.fromEntries(WineRelations.map((key) => [key, true])),
      ...options,
    });
  }

  async findOne(options: FindOneOptions<Wine>): Promise<Wine> {
    const wine = await this.wineRepository.findOne({
      relations: Object.fromEntries(WineRelations.map((key) => [key, true])),
      ...options,
    });
    if (!wine)
      throw new NotFoundException(
        `Wine with ${JSON.stringify(options.where)} not found`,
      );
    return wine;
  }

  async count(options: FindManyOptions<Wine>): Promise<number> {
    return await this.wineRepository.count(options);
  }

  async findAllPaginated(
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    return buildPageDto(this, paginationOptionsDto, {}, 'createdAt');
  }

  async remove(id: string): Promise<Wine> {
    const wine: Wine = await this.findOne({ where: { id } });
    await this.wineRepository.remove(wine);
    return wine;
  }

  async update(id: string, storeIds: string[]): Promise<Wine> {
    const wine = await this.findOne({
      where: { id },
    });

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
}
