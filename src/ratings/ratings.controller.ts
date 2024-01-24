import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@Controller('ratings')
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiTags('ratings')
@ApiBearerAuth()
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @ApiOperation({ summary: 'get rating by id' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  @ApiOkResponse({
    description: 'Rating has been found',
    type: Rating,
  })
  @ApiNotFoundResponse({
    description: 'Rating has not been found',
  })
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<Rating> {
    return this.ratingsService.findOne({ where: { id } });
  }

  @ApiOperation({ summary: 'get all ratings' })
  @HttpCode(HttpStatus.OK)
  @Get()
  @ApiOkResponse({
    description: 'Ratings have been found',
    type: Rating,
    isArray: true,
  })
  findAll(): Promise<Rating[]> {
    return this.ratingsService.findMany();
  }

  @ApiOperation({ summary: 'delete a rating' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  @ApiOkResponse({
    description: 'Rating has been deleted',
    type: Rating,
  })
  @ApiNotFoundResponse({
    description: 'Rating has not been found',
  })
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<Rating> {
    return this.ratingsService.remove(id);
  }
}
