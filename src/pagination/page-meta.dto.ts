import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptionsDto } from './pagination-options.dto';

export class PageMetaDto {
  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly take: number;

  @ApiProperty()
  readonly itemCount: number;

  @ApiProperty()
  get pageCount(): number {
    return Math.ceil(this.itemCount / this.take);
  }

  @ApiProperty()
  get hasPreviousPage(): boolean {
    return this.page > 1;
  }

  @ApiProperty()
  get hasNextPage(): boolean {
    return this.page < this.pageCount;
  }

  constructor({
    paginationOptionsDto,
    itemCount,
  }: {
    paginationOptionsDto: PaginationOptionsDto;
    itemCount: number;
  }) {
    this.page = paginationOptionsDto.page;
    this.take = paginationOptionsDto.take;
    this.itemCount = itemCount;
  }
}
