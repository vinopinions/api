import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import {
  ID_URL_PARAMETER,
  ID_URL_PARAMETER_NAME,
} from '../constants/url-parameter';
import { ApiPaginationResponse } from '../pagination/ApiPaginationResponse';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { CreateWinemakerDto } from './dtos/create-winemaker.dto';
import { Winemaker } from './entities/winemaker.entity';
import { WinemakersService } from './winemakers.service';

const WINEMAKERS_ENDPOINT_NAME = 'winemakers';
export const WINEMAKERS_ENDPOINT = `/${WINEMAKERS_ENDPOINT_NAME}`;
const WINEMAKERS_ID_URL_PARAMETER = ID_URL_PARAMETER;
export const WINEMAKERS_ID_ENDPOINT = `${WINEMAKERS_ENDPOINT}/${WINEMAKERS_ID_URL_PARAMETER}`;

@Controller(WINEMAKERS_ENDPOINT_NAME)
@ApiTags(WINEMAKERS_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class WinemakersController {
  constructor(private winemakersService: WinemakersService) {}

  @ApiPaginationResponse(Winemaker, {
    description: 'Incoming friend requests have been found',
    status: HttpStatus.OK,
  })
  @ApiOperation({ summary: 'get all winemakers' })
  @Get()
  findAll(
    @Query() paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Winemaker>> {
    return this.winemakersService.findAllPaginated(paginationOptionsDto);
  }

  @ApiOperation({ summary: 'get winemaker by id' })
  @HttpCode(HttpStatus.OK)
  @Get(WINEMAKERS_ID_URL_PARAMETER)
  @ApiOkResponse({
    description: 'Winemaker has been found',
    type: Winemaker,
  })
  @ApiNotFoundResponse({
    description: 'Winemaker has not been found',
  })
  findById(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
  ): Promise<Winemaker> {
    return this.winemakersService.findOne({
      where: { id },
    });
  }

  @ApiOperation({ summary: 'create a winemaker' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiCreatedResponse({
    description: 'Winemaker has been created',
    type: Winemaker,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() createWinemakersDto: CreateWinemakerDto) {
    return this.winemakersService.create(createWinemakersDto.name);
  }
}
