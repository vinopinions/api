import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
} from 'typeorm';
import { PageMetaDto } from './page-meta.dto';
import { PageDto } from './page.dto';
import { PaginationOptionsDto } from './pagination-options.dto';

export type MinimalService<Entity> = {
  findMany(options?: FindManyOptions<Entity>): Promise<Entity[]>;
  findOne(options: FindOneOptions<Entity>): Promise<Entity>;
  count(options: FindManyOptions<Entity>): Promise<number>;
};

export const buildPageDto = async <Entity>(
  service: MinimalService<Entity>,
  paginationOptionsDto: PaginationOptionsDto,
  findOptionsWhere: FindOptionsWhere<Entity>[] | FindOptionsWhere<Entity>,
  orderKey: keyof Entity,
) => {
  // get total item count
  const itemCount: number = await service.count({
    where: findOptionsWhere,
  });
  // get items sorted and only with the amount defined in `paginationOptionsDto.take`
  const entities: Entity[] = await service.findMany({
    where: findOptionsWhere,
    order: {
      [orderKey]: paginationOptionsDto.order,
    } as FindOptionsOrder<Entity>, // have to use a type assertion here, because typescript does not recognize that orderKey is keyof Entity
    skip: paginationOptionsDto.skip,
    take: paginationOptionsDto.take,
  });

  const pageMetaDto = new PageMetaDto({ itemCount, paginationOptionsDto });

  return new PageDto(entities, pageMetaDto);
};
