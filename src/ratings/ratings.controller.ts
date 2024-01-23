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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@Controller('ratings')
@ApiTags('ratings')
@ApiBearerAuth()
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @ApiOperation({ summary: 'get rating by id' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.ratingsService.findOne({ where: { id } });
  }

  @ApiOperation({ summary: 'get all ratings' })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.ratingsService.findMany();
  }

  @ApiOperation({ summary: 'create a rating' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(createRatingDto);
  }

  @ApiOperation({ summary: 'delete a rating' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.ratingsService.remove(id);
  }
}
