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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateRatingDto } from '../ratings/dtos/create-rating.dto';
import { RatingsService } from '../ratings/ratings.service';
import { Rating } from './../ratings/entities/rating.entity';
import { CreateWineDto } from './dtos/create-wine.dto';
import { Wine } from './entities/wine.entity';
import { WinesService } from './wines.service';

@Controller('wines')
@ApiTags('wines')
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
export class WinesController {
  constructor(
    private wineService: WinesService,
    private ratingsService: RatingsService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  @ApiOkResponse({
    description: 'Wine has been found',
    type: Wine,
  })
  @ApiNotFoundResponse({
    description: 'Wine has not been found',
  })
  findById(@Param('id') id: string) {
    return this.wineService.findOne({ where: { id } });
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  @ApiOkResponse({
    description: 'Wines have been found',
    type: Wine,
    isArray: true,
  })
  findAll(): Promise<Wine[]> {
    return this.wineService.findMany();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiCreatedResponse({
    description: 'Wine has been created',
    type: Rating,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() createWineDto: CreateWineDto) {
    return this.wineService.create(createWineDto);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  @ApiCreatedResponse({
    description: 'Store has been added to the wine',
    type: Wine,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  @ApiNotFoundResponse({
    description: 'Wine or store has not been found',
  })
  addStores(
    @Param('id') id: string,
    @Body() updatedWine: CreateWineDto,
  ): Promise<Wine> {
    return this.wineService.update(id, updatedWine);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':wineId/ratings')
  @ApiCreatedResponse({
    description: 'Ratings has been added to the wine',
    type: Rating,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  @ApiNotFoundResponse({
    description: 'Wine has not been found',
  })
  createRating(
    @Param('wineId') wineId: string,
    @Body() createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    return this.ratingsService.create({ ...createRatingDto, wineId });
  }

  @ApiOkResponse({
    description: 'Ratings for the wine have been found',
    type: Rating,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'Wine has not been found',
  })
  @HttpCode(HttpStatus.OK)
  @Get(':wineId/ratings')
  getRatingsForWines(@Param('wineId') wineId: string): Promise<Rating[]> {
    return this.ratingsService.getByWineId(wineId);
  }
}
