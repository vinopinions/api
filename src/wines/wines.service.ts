import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WinemakersService } from './../winemakers/winemakers.service';
import { Wine } from './entities/wine.entity';
import { Store } from '../stores/entities/store.entity';
import { StoresService } from '../stores/stores.service';
import { Winemaker } from '../winemakers/entities/winemaker.entity';

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
    storeId: string;
    grapeVariety: string;
    heritage: string;
  }): Promise<Wine> {
    const winemaker: Winemaker | null = await this.winemakersService.find(
      data.winemakerId,
    );
    const store: Store | null = await this.storesService.find(data.storeId);

    if (!winemaker) throw new BadRequestException('Winemaker not found');
    if (!store) throw new BadRequestException('Store not found');

    const wine: Wine = this.wineRepository.create(data);
    wine.winemaker = winemaker;
    wine.stores = [store];
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
