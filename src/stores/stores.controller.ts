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
import {
  ID_URL_PARAMETER,
  ID_URL_PARAMETER_NAME,
} from '../constants/url-parameter';
import { CreateStoreDto } from './dtos/create-store.dto';
import { Store } from './entities/store.entity';
import { StoresService } from './stores.service';

const STORES_ENDPOINT_NAME = 'stores';
export const STORES_ENDPOINT = `/${STORES_ENDPOINT_NAME}`;
const STORES_ID_URL_PARAMETER = ID_URL_PARAMETER;
export const STORES_ID_ENDPOINT = `/${STORES_ENDPOINT_NAME}/${STORES_ID_URL_PARAMETER}`;
@Controller(STORES_ENDPOINT_NAME)
@ApiTags(STORES_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class StoresController {
  constructor(private storesService: StoresService) {}

  @ApiOperation({ summary: 'get store by id' })
  @HttpCode(HttpStatus.OK)
  @Get(STORES_ID_URL_PARAMETER)
  @ApiOkResponse({
    description: 'Store has been found',
    type: Store,
  })
  @ApiNotFoundResponse({
    description: 'Store has not been found',
  })
  findById(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
  ): Promise<Store> {
    return this.storesService.findOne({ where: { id }, relations: ['wines'] });
  }

  @ApiOperation({ summary: 'get all stores' })
  @HttpCode(HttpStatus.OK)
  @Get()
  @ApiOkResponse({
    description: 'Stores have been found',
    type: Store,
    isArray: true,
  })
  findAll(): Promise<Store[]> {
    return this.storesService.findMany();
  }

  @ApiOperation({ summary: 'create a store' })
  @Post()
  @ApiCreatedResponse({
    description: 'Store has been created',
    type: Store,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() { name, address, url }: CreateStoreDto): Promise<Store> {
    return this.storesService.create(name, address, url);
  }
}
