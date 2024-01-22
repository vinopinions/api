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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@ApiTags('ratings')
@ApiBearerAuth()
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.ratingsService.findOne({ where: { id } });
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.ratingsService.findMany();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(createRatingDto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.ratingsService.remove(id);
  }
}
