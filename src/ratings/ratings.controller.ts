import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  @ApiOkResponse({
    description: 'Rating has been found',
    type: Rating,
  })
  @ApiNotFoundResponse({
    description: 'Rating has not been found',
  })
  findById(@Param('id') id: string): Promise<Rating> {
    return this.ratingsService.findOne({ where: { id } });
  }

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

  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiCreatedResponse({
    description: 'Rating has been created',
    type: Rating,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() createRatingDto: CreateRatingDto): Promise<Rating> {
    return this.ratingsService.create(createRatingDto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  @ApiOkResponse({
    description: 'Rating has been deleted',
    type: Rating,
  })
  @ApiNotFoundResponse({
    description: 'Rating has not been found',
  })
  delete(@Param('id') id: string): Promise<Rating> {
    return this.ratingsService.remove(id);
  }
}
