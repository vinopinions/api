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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'get wine by id' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.wineService.findOneById(id);
  }

  @ApiOperation({ summary: 'get all wines' })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.wineService.findAll();
  }

  @ApiOperation({ summary: 'create a wine' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createWineDto: CreateWineDto) {
    return this.wineService.create(createWineDto);
  }

  @ApiOperation({ summary: 'update a wine' })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  update(@Param('id') id: string, @Body() updatedWine: CreateWineDto) {
    return this.wineService.update(id, updatedWine);
  }

  @ApiOperation({ summary: 'rate a wine' })
  @HttpCode(HttpStatus.CREATED)
  @Post(':wineId/ratings')
  createRating(
    @Param('wineId') wineId: string,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.create({ ...createRatingDto, wineId });
  }

  @ApiOperation({ summary: 'get all ratings of a wine' })
  @HttpCode(HttpStatus.OK)
  @Get(':wineId/ratings')
  getRatingsForWines(@Param('wineId') wineId: string) {
    return this.ratingsService.getByWineId(wineId);
  }
}
