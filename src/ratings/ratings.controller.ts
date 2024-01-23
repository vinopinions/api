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
<<<<<<< HEAD
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
=======
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
>>>>>>> developer
import { CreateRatingDto } from './dtos/create-rating.dto';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@Controller('ratings')
<<<<<<< HEAD
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
=======
@ApiTags('ratings')
@ApiBearerAuth()
>>>>>>> developer
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
  findById(@Param('id') id: string): Promise<Rating> {
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

  @ApiOperation({ summary: 'create a rating' })
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
  delete(@Param('id') id: string): Promise<Rating> {
    return this.ratingsService.remove(id);
  }
}
