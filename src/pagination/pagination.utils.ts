import { FindManyOptions, FindOptionsOrder, ObjectLiteral } from 'typeorm';
import { CommonService } from '../common/common.service';
import { PageMetaDto } from './page-meta.dto';
import { PageDto } from './page.dto';
import { PaginationOptionsDto } from './pagination-options.dto';

export const buildPageDto = async <Entity extends ObjectLiteral>(
  service: CommonService<Entity>,
  paginationOptionsDto: PaginationOptionsDto,
  orderKey: keyof Entity,
  options?: FindManyOptions<Entity>,
): Promise<PageDto<Entity>> => {
  const itemCount: number = await service.count(options);
  const entities: Entity[] = await service.findMany({
    order: {
      [orderKey]: paginationOptionsDto.order,
    } as FindOptionsOrder<Entity>, // have to use a type assertion here, because typescript does not recognize that orderKey is keyof Entity
    skip: paginationOptionsDto.skip,
    take: paginationOptionsDto.take,
    ...options,
  });

  const pageMetaDto = new PageMetaDto({ itemCount, paginationOptionsDto });

  return new PageDto(entities, pageMetaDto);
};
