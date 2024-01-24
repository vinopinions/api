import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateRatingDto } from '../ratings/dtos/create-rating.dto';
import { RatingsService } from '../ratings/ratings.service';
import { Rating } from './../ratings/entities/rating.entity';
import { CreateWineDto } from './dtos/create-wine.dto';
import { Wine } from './entities/wine.entity';
import { WinesService } from './wines.service';
import { AuthenticatedRequest } from 'src/auth/auth.guard';

@Controller('wines')
@ApiTags('wines')
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class WinesController {
  constructor(
    private wineService: WinesService,
    private ratingsService: RatingsService,
  ) {}

  @ApiOperation({ summary: 'get wine by id' })
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

  @ApiOperation({ summary: 'get all wines' })
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

  @ApiOperation({ summary: 'create a wine' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiCreatedResponse({
    description: 'Wine has been created',
    type: Wine,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() createWineDto: CreateWineDto): Promise<Wine> {
    return this.wineService.create(createWineDto);
  }

  @ApiOperation({ summary: 'update a wine' })
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
  update(@Param('id') id: string, @Body() updatedWine: CreateWineDto) {
    return this.wineService.update(id, updatedWine);
  }

  @ApiOperation({ summary: 'rate a wine' })
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
  async createRating(
    @Param('wineId') wineId: string,
    @Body() createRatingDto: CreateRatingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Rating> {
    const wine: Wine = await this.wineService.findOne({
      where: { id: wineId },
    });
    return this.ratingsService.create(createRatingDto, request.user, wine);
  }

  @ApiOkResponse({
    description: 'Ratings for the wine have been found',
    type: Rating,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'Wine has not been found',
  })
  @ApiOperation({ summary: 'get all ratings of a wine' })
  @HttpCode(HttpStatus.OK)
  @Get(':wineId/ratings')
  getRatingsForWines(
    @Param('wineId', new ParseUUIDPipe()) wineId: string,
  ): Promise<Rating[]> {
    return this.wineService.getRatingsForWine(wineId);
  }
}
