import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { PageDto } from '../pagination/page.dto';
import { Wine } from '../wines/entities/wine.entity';
import { WinesService } from '../wines/wines.service';
import { PaginationOptionsDto } from './../pagination/pagination-options.dto';
import { Store } from './entities/store.entity';

@Injectable()
export class StoresService extends CommonService<Store> {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
    @Inject(forwardRef(() => WinesService)) private winesService: WinesService,
  ) {
    super(storeRepository, Store);
  }

  async create(name: string, address?: string, url?: string): Promise<Store> {
    const store: Store = this.storeRepository.create({ name, address, url });
    const dbStore = await this.storeRepository.save(store);
    return this.findOne({ where: { id: dbStore.id } });
  }

  async findWinesPaginated(
    store: Store,
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Wine>,
  ): Promise<PageDto<Wine>> {
    return await this.winesService.findManyByStorePaginated(
      store,
      paginationOptionsDto,
      options,
    );
  }

  async findManyByWinePaginated(
    wine: Wine,
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Store>,
  ): Promise<PageDto<Store>> {
    return await this.findManyPaginated(paginationOptionsDto, {
      relations: ['wines'],
      where: { ...{ wines: { id: wine.id }, ...options } },
    });
  }

  async remove(id: string): Promise<Store> {
    const store: Store | null = await this.findOne({ where: { id } });
    await this.storeRepository.remove(store);
    return store;
  }
}
