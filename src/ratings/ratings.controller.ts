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
import {
  ID_URL_PARAMETER,
  ID_URL_PARAMETER_NAME,
} from '../constants/url-parameter';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

const RATINGS_ENDPOINT_NAME = 'ratings';
export const RATINGS_ENDPOINT = `/${RATINGS_ENDPOINT_NAME}`;
const RATINGS_ID_URL_PARAMETER = ID_URL_PARAMETER;
export const RATINGS_ID_ENDPOINT = `${RATINGS_ENDPOINT}/${RATINGS_ID_URL_PARAMETER}`;

@ApiTags(RATINGS_ENDPOINT_NAME)
@Controller(RATINGS_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiTags(RATINGS_ENDPOINT_NAME)
@ApiBearerAuth()
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @ApiOperation({ summary: 'get rating by id' })
  @HttpCode(HttpStatus.OK)
  @Get(RATINGS_ID_URL_PARAMETER)
  @ApiOkResponse({
    description: 'Rating has been found',
    type: Rating,
  })
  @ApiNotFoundResponse({
    description: 'Rating has not been found',
  })
  findById(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
  ): Promise<Rating> {
    return this.ratingsService.findOne({
      where: { id },
    });
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
  @Delete(RATINGS_ID_URL_PARAMETER)
  @ApiOkResponse({
    description: 'Rating has been deleted',
    type: Rating,
  })
  @ApiNotFoundResponse({
    description: 'Rating has not been found',
  })
  delete(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
  ): Promise<Rating> {
    return this.ratingsService.remove(id);
  }
}
