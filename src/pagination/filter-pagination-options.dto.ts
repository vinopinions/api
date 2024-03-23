import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationOptionsDto } from './pagination-options.dto';

export class FilterPaginationOptionsDto extends PaginationOptionsDto {
  @ApiPropertyOptional({
    description: 'the term to filter the results',
    type: String,
    default: '',
  })
  filter: string = '';
}
