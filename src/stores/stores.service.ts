import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { buildPageDto } from '../pagination/pagination.utils';
import { Wine } from '../wines/entities/wine.entity';
import { WinesService } from '../wines/wines.service';
import { PaginationOptionsDto } from './../pagination/pagination-options.dto';
import { Store } from './entities/store.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
    @Inject(forwardRef(() => WinesService)) private winesService: WinesService,
  ) {}

  async create(name: string, address?: string, url?: string): Promise<Store> {
    const store: Store = this.storeRepository.create({ name, address, url });
    const dbStore = await this.storeRepository.save(store);
    return this.findOne({ where: { id: dbStore.id } });
  }

  findMany(options?: FindManyOptions<Store>) {
    return this.storeRepository.find(options);
  }

  async findOne(options: FindOneOptions<Store>): Promise<Store> {
    const store = await this.storeRepository.findOne(options);
    if (!store)
      throw new NotFoundException(
        `Store with ${JSON.stringify(options.where)} not found`,
      );
    return store;
  }

  async count(options: FindManyOptions<Store>): Promise<number> {
    return await this.storeRepository.count(options);
  }

  async findManyPaginated(
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Store>,
  ): Promise<PageDto<Store>> {
    return await buildPageDto(
      this.storeRepository,
      paginationOptionsDto,
      'createdAt',
      options,
    );
  }

  async findAllPaginated(
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Store>> {
    return await this.findManyPaginated(paginationOptionsDto);
  }

  async findWinesPaginated(
    store: Store,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    return await this.winesService.findManyByStorePaginated(
      store,
      paginationOptionsDto,
    );
  }

  async findManyByWinePaginated(
    wine: Wine,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Store>> {
    return await this.findManyPaginated(paginationOptionsDto, {
      relations: ['wines'],
      where: { wines: { id: wine.id } },
    });
  }

  async remove(id: string): Promise<Store> {
    const store: Store | null = await this.findOne({ where: { id } });
    await this.storeRepository.remove(store);
    return store;
  }
}
