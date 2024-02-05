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
import { AuthenticatedRequest } from '../auth/auth.guard';
import { CreateRatingDto } from '../ratings/dtos/create-rating.dto';
import { RatingsService } from '../ratings/ratings.service';
import { Rating } from './../ratings/entities/rating.entity';
import { CreateWineDto } from './dtos/create-wine.dto';
import { UpdateWineDto } from './dtos/update-wine.dto';
import { Wine } from './entities/wine.entity';
import { WinesService } from './wines.service';

const WINES_ENDPOINT_NAME = 'wines';
export const WINES_ENDPOINT = `/${WINES_ENDPOINT_NAME}`;
const WINES_ID_ENDPOINT_NAME = ':id';
export const WINES_ID_ENDPOINT = `${WINES_ENDPOINT}/${WINES_ID_ENDPOINT_NAME}`;
const WINES_ID_RATINGS_NAME = `${WINES_ID_ENDPOINT_NAME}/ratings`;
export const WINES_ID_RATINGS_ENDPOINT = `${WINES_ENDPOINT}/${WINES_ID_RATINGS_NAME}`;

@Controller(WINES_ENDPOINT_NAME)
@ApiTags(WINES_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class WinesController {
  constructor(
    private winesService: WinesService,
    private ratingsService: RatingsService,
  ) {}

  @ApiOperation({ summary: 'get wine by id' })
  @HttpCode(HttpStatus.OK)
  @Get(WINES_ID_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Wine has been found',
    type: Wine,
  })
  @ApiNotFoundResponse({
    description: 'Wine has not been found',
  })
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.winesService.findOne({ where: { id } });
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
    return this.winesService.findMany();
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
    return this.winesService.create(
      createWineDto.name,
      createWineDto.year,
      createWineDto.winemakerId,
      createWineDto.storeIds,
      createWineDto.grapeVariety,
      createWineDto.heritage,
    );
  }

  @ApiOperation({ summary: 'update a wine' })
  @HttpCode(HttpStatus.OK)
  @Put(WINES_ID_ENDPOINT_NAME)
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
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateWineDto: UpdateWineDto,
  ) {
    return this.winesService.update(id, updateWineDto.storeIds);
  }

  @ApiOperation({ summary: 'rate a wine' })
  @HttpCode(HttpStatus.CREATED)
  @Post(WINES_ID_RATINGS_NAME)
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
    @Body() { stars, text }: CreateRatingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Rating> {
    const wine: Wine = await this.winesService.findOne({
      where: { id: wineId },
    });
    return this.ratingsService.create(stars, text, request.user, wine);
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
    return this.winesService.getRatingsForWine(wineId);
  }
}
