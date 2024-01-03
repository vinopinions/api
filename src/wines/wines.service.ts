import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../stores/entities/store.entity';
import { StoresService } from '../stores/stores.service';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { WinemakersService } from './../winemakers/winemakers.service';
import { Wine } from './entities/wine.entity';
import { CreateWineDto } from './dtos/create-wine.dto';

@Injectable()
export class WinesService {
  constructor(
    @InjectRepository(Wine) private wineRepository: Repository<Wine>,
    private winemakersService: WinemakersService,
    private storesService: StoresService,
  ) {}

  async create(data: {
    name: string;
    year: number;
    winemakerId: string;
    storeIds: string[];
    grapeVariety: string;
    heritage: string;
  }): Promise<Wine> {
    const winemaker: Winemaker | null =
      await this.winemakersService.findOneById(data.winemakerId);

    const stores: Store[] = await Promise.all(
      (data.storeIds ?? []).map(async (storeId: string) => {
        const store: Store | null =
          await this.storesService.findOneById(storeId);
        return store;
      }),
    );

    const wine: Wine = this.wineRepository.create(data);
    wine.winemaker = winemaker;
    wine.stores = stores;
    return this.wineRepository.save(wine);
  }

  findAll() {
    return this.wineRepository.find();
  }

  async findOneById(id: string): Promise<Wine> {
    const wine: Wine | null = await this.wineRepository.findOne({
      where: { id },
      relations: {
        winemaker: true,
        stores: true,
      },
    });
    if (!wine) throw new NotFoundException('Wine not found');
    return wine;
  }

  async remove(id: string): Promise<Wine> {
    const Wine: Wine = await this.findOneById(id);
    return this.wineRepository.remove(Wine);
  }

  async update(id: string, updatedWine: CreateWineDto): Promise<Wine> {
    const wine = await this.wineRepository.findOneOrFail({
      where: { id },
      relations: ['stores'],
    });

    if (!wine) throw new NotFoundException('Wine not found.');

    if (updatedWine.storeIds && updatedWine.storeIds.length > 0) {
      const stores: Store[] = await Promise.all(
        updatedWine.storeIds.map(async (storeId: string) => {
          const store: Store | null =
            await this.storesService.findOneById(storeId);
          if (!store)
            throw new BadRequestException(`Store with id ${storeId} not found`);
          if (wine.stores.find((s) => s.id == store.id))
            throw new BadRequestException(
              `Store with id ${store.id} already added to wine`,
            );
          return store;
        }),
      );
      wine.stores = [...wine.stores, ...stores];
      Object.assign(wine, updatedWine);
    }
    return this.wineRepository.save(wine);
  }
}
