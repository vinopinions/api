import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { buildPageDto } from '../pagination/pagination.utils';

@Injectable()
export class CommonService<Entity extends ObjectLiteral> {
  constructor(
    private repository: Repository<Entity>,
    private entityClass: { new (): Entity },
  ) {}

  findMany(options?: FindManyOptions<Entity>) {
    return this.repository.find(options);
  }

  async findOne(options: FindOneOptions<Entity>): Promise<Entity> {
    const user = await this.repository.findOne(options);
    if (!user)
      throw new NotFoundException(
        `${this.entityClass.name} with ${JSON.stringify(options.where)} not found`,
      );
    return user;
  }

  async findManyPaginated(
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Entity>,
  ): Promise<PageDto<Entity>> {
    return await buildPageDto(
      this.repository,
      paginationOptionsDto,
      'createdAt',
      options,
    );
  }

  async findAllPaginated(
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Entity>> {
    return await this.findManyPaginated(paginationOptionsDto);
  }
}
