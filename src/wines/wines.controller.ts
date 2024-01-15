import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateRatingDto } from '../ratings/dtos/create-rating.dto';
import { RatingsService } from '../ratings/ratings.service';
import { CreateWineDto } from './dtos/create-wine.dto';
import { WinesService } from './wines.service';

@Controller('wines')
@ApiTags('wines')
export class WinesController {
  constructor(
    private wineService: WinesService,
    private ratingsService: RatingsService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.wineService.findOne({ where: { id } });
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.wineService.findAll();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createWineDto: CreateWineDto) {
    return this.wineService.create(createWineDto);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  addStores(@Param('id') id: string, @Body() updatedWine: CreateWineDto) {
    return this.wineService.update(id, updatedWine);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':wineId/ratings')
  createRating(
    @Param('wineId') wineId: string,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.create({ ...createRatingDto, wineId });
  }

  @HttpCode(HttpStatus.OK)
  @Get(':wineId/ratings')
  getRatingsForWines(@Param('wineId') wineId: string) {
    return this.ratingsService.getByWineId(wineId);
  }
}
