import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { Store } from '../stores/entities/store.entity';
import { StoresService } from '../stores/stores.service';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { WinemakersService } from './../winemakers/winemakers.service';
import { Wine } from './entities/wine.entity';

@Injectable()
export class WinesService {
  constructor(
    @InjectRepository(Wine) private wineRepository: Repository<Wine>,
    private winemakersService: WinemakersService,
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
    return this.wineRepository.save(wine);
  }

  findMany(options?: FindManyOptions<Wine>) {
    return this.wineRepository.find(options);
  }

  async findOne(options: FindOneOptions<Wine>): Promise<Wine> {
    const user = await this.wineRepository.findOne(options);
    if (!user)
      throw new NotFoundException(
        `Wine with ${JSON.stringify(options.where)} not found`,
      );
    return user;
  }

  async remove(id: string): Promise<Wine> {
    const Wine: Wine = await this.findOne({ where: { id } });
    return this.wineRepository.remove(Wine);
  }

  async update(id: string, storeIds: string[]): Promise<Wine> {
    const wine = await this.wineRepository.findOneOrFail({
      where: { id },
      relations: {
        stores: true,
      },
    });

    if (!storeIds || storeIds.length < 0) wine.stores = [];
    else {
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

    return this.wineRepository.save(wine);
  }

  async getRatingsForWine(wineId: string): Promise<Rating[]> {
    return await this.ratingsService.findMany({
      where: { wine: { id: wineId } },
      relations: {
        user: true,
        wine: true,
      },
    });
  }
}
