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
    const winemaker: Winemaker | null = await this.winemakersService.find(
      data.winemakerId,
    );
    if (!winemaker) throw new BadRequestException('Winemaker not found');

    const stores: Store[] = await Promise.all(
      data.storeIds.map(async (storeId: string) => {
        const store: Store | null = await this.storesService.find(storeId);
        if (!store)
          throw new BadRequestException(`Store with id ${storeId} not found`);

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

  findOneById(id: string): Promise<Wine | null> {
    return this.wineRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<Wine> {
    const Wine: Wine | null = await this.findOneById(id);
    if (Wine === null) throw new NotFoundException();
    return this.wineRepository.remove(Wine);
  }
}
