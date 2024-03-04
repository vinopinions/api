import {
  FindManyOptions,
  FindOptionsOrder,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { PageMetaDto } from './page-meta.dto';
import { PageDto } from './page.dto';
import { PaginationOptionsDto } from './pagination-options.dto';

const QUERY_BUILDER_ALIAS = 'entity';

export const buildPageDto = async <Entity extends ObjectLiteral>(
  repository: Repository<Entity>,
  paginationOptionsDto: PaginationOptionsDto,
  orderKey: keyof Entity,
  options?: FindManyOptions<Entity>,
): Promise<PageDto<Entity>> => {
  const itemCount: number = await repository.count(options);
  const entities: Entity[] = await repository.find({
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

export const buildOneToOneRelationPageDto = async <
  Entity extends ObjectLiteral,
>(
  repository: Repository<Entity>,
  paginationOptionsDto: PaginationOptionsDto,
  relationParameter: { key: string; value: any },
  orderKey: keyof Entity,
): Promise<PageDto<Entity>> => {
  const queryBuilder: SelectQueryBuilder<Entity> = await repository
    .createQueryBuilder(QUERY_BUILDER_ALIAS)
    .where(
      `${QUERY_BUILDER_ALIAS}.${relationParameter.key} = :value`,
      relationParameter,
    )
    .take(paginationOptionsDto.take)
    .skip(paginationOptionsDto.skip)
    .orderBy(
      `${QUERY_BUILDER_ALIAS}.${String(orderKey)} ${paginationOptionsDto.order}`,
    );

  const itemCount: number = await queryBuilder.getCount();
  const entities: Entity[] = await queryBuilder.getMany();

  const pageMetaDto = new PageMetaDto({ itemCount, paginationOptionsDto });

  return new PageDto(entities, pageMetaDto);
};
