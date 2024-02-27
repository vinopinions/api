import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Store, StoreRelations } from './entities/store.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
  ) {}

  async create(name: string, address?: string, url?: string): Promise<Store> {
    const store: Store = this.storeRepository.create({ name, address, url });
    const dbStore = await this.storeRepository.save(store);
    return this.findOne({ where: { id: dbStore.id } });
  }

  findMany(options?: FindManyOptions<Store>) {
    return this.storeRepository.find({
      relations: Object.fromEntries(StoreRelations.map((key) => [key, true])),
      ...options,
    });
  }

  async findOne(options: FindOneOptions<Store>): Promise<Store> {
    const store = await this.storeRepository.findOne({
      relations: Object.fromEntries(StoreRelations.map((key) => [key, true])),
      ...options,
    });
    if (!store)
      throw new NotFoundException(
        `Store with ${JSON.stringify(options.where)} not found`,
      );
    return store;
  }

  async remove(id: string): Promise<Store> {
    const store: Store | null = await this.findOne({ where: { id } });
    await this.storeRepository.remove(store);
    return store;
  }
}
