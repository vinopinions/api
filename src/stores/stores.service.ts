import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Store } from './entities/store.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
  ) {}

  async create(name: string): Promise<Store> {
    const store: Store = this.storeRepository.create({ name });
    return this.storeRepository.save(store);
  }

  findMany(options?: FindManyOptions<Store>) {
    return this.storeRepository.find(options);
  }
  async findOne(options: FindOneOptions<Store>): Promise<Store> {
    const Rating = await this.storeRepository.findOne(options);
    if (!Rating)
      throw new NotFoundException(
        `Store with ${JSON.stringify(options.where)} not found`,
      );
    return Rating;
  }

  async remove(id: string): Promise<Store> {
    const store: Store | null = await this.findOne({ where: { id } });
    return this.storeRepository.remove(store);
  }
}
