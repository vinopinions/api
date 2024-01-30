import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { CreateWineMakerDto } from './dtos/create-winemaker.dto';
import { Winemaker } from './entities/winemaker.entity';
import { WinemakersService } from './winemakers.service';

const WINEMAKERS_ENDPOINT_NAME = 'winemakers';
export const WINEMAKERS_ENDPOINT = `/${WINEMAKERS_ENDPOINT_NAME}`;
const WINEMAKERS_ID_ENDPOINT_NAME = ':id';
export const WINEMAKERS_ID_ENDPOINT = `${WINEMAKERS_ENDPOINT}/${WINEMAKERS_ID_ENDPOINT_NAME}`;

@Controller(WINEMAKERS_ENDPOINT_NAME)
@ApiTags(WINEMAKERS_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class WinemakersController {
  constructor(private winemakersService: WinemakersService) {}

  @ApiOkResponse({
    description: 'Winemakers have been found',
    type: Winemaker,
    isArray: true,
  })
  @ApiOperation({ summary: 'get all winemakers' })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(): Promise<Winemaker[]> {
    return this.winemakersService.findMany();
  }

  @ApiOperation({ summary: 'get winemaker by id' })
  @HttpCode(HttpStatus.OK)
  @Get(WINEMAKERS_ID_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Winemaker has been found',
    type: Winemaker,
  })
  @ApiNotFoundResponse({
    description: 'Winemaker has not been found',
  })
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<Winemaker> {
    return this.winemakersService.findOne({ where: { id } });
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
  create(@Body() createWinemakersDto: CreateWineMakerDto) {
    return this.winemakersService.create(createWinemakersDto.name);
  }
}
