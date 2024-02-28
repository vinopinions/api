import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationOrder } from './pagination-order';

export const PAGE_DEFAULT_VALUE: number = 1;
export const TAKE_DEFAULT_VALUE: number = 10;

export class PaginationOptionsDto {
  @ApiPropertyOptional({ enum: PaginationOrder, default: PaginationOrder.ASC })
  @IsEnum(PaginationOrder)
  @IsOptional()
  readonly order: PaginationOrder = PaginationOrder.ASC;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page: number = PAGE_DEFAULT_VALUE;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly take: number = TAKE_DEFAULT_VALUE;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
