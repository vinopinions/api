import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { PageDto } from '../pagination/page.dto';
import { buildPageDto } from '../pagination/pagination.utils';
import { PaginationOptionsDto } from './../pagination/pagination-options.dto';

@Injectable()
export class CommonService<Entity extends ObjectLiteral> {
  constructor(
    private repository: Repository<Entity>,
    private entityClass: { new (): Entity },
    private additionalConfiguration?: (entity: Entity) => Promise<Entity>,
  ) {}

  async findMany(options?: FindManyOptions<Entity>) {
    let entities = await this.repository.find(options);

    if (this.additionalConfiguration) {
      entities = await Promise.all(
        entities.map(
          async (entity) => await this.additionalConfiguration!(entity),
        ),
      );
    }

    return entities;
  }

  async findOne(options: FindOneOptions<Entity>): Promise<Entity> {
    let entity = await this.repository.findOne(options);
    if (!entity) throw this.buildNotFoundException(options.where);
    if (this.additionalConfiguration)
      entity = await this.additionalConfiguration(entity);

    return entity;
  }

  async findManyPaginated(
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Entity>,
  ): Promise<PageDto<Entity>> {
    return await buildPageDto(this, paginationOptionsDto, 'createdAt', options);
  }

  async findAllPaginated(
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Entity>> {
    return await this.findManyPaginated(paginationOptionsDto);
  }

  async count(options?: FindManyOptions<Entity>): Promise<number> {
    return await this.repository.count(options);
  }

  buildNotFoundException(where?: object) {
    if (where)
      return new NotFoundException(
        `${this.entityClass.name} with ${JSON.stringify(where)} not found`,
      );

    return new NotFoundException(`${this.entityClass.name} not found`);
  }
}
