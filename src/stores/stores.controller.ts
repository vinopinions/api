import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ILike } from 'typeorm';
import { FileUploadDto } from '../common/dtos/FileUploadDto';
import {
  ID_URL_PARAMETER,
  ID_URL_PARAMETER_NAME,
} from '../constants/url-parameter';
import { ApiPaginationResponse } from '../pagination/ApiPaginationResponse';
import { FilterPaginationOptionsDto } from '../pagination/filter-pagination-options.dto';
import { FILE_MAX_SIZE } from '../s3/constants';
import { Wine } from '../wines/entities/wine.entity';
import { PageDto } from './../pagination/page.dto';
import { CreateStoreDto } from './dtos/create-store.dto';
import { Store } from './entities/store.entity';
import { StoresService } from './stores.service';

const STORES_ENDPOINT_NAME = 'stores';
export const STORES_ENDPOINT = `/${STORES_ENDPOINT_NAME}`;
const STORES_ID_URL_PARAMETER = ID_URL_PARAMETER;
export const STORES_ID_ENDPOINT = `${STORES_ENDPOINT}/${STORES_ID_URL_PARAMETER}`;
const STORES_ID_WINES_ENDPOINT_NAME = `${STORES_ID_URL_PARAMETER}/wines`;
export const STORES_ID_WINES_ENDPOINT = `${STORES_ENDPOINT}/${STORES_ID_WINES_ENDPOINT_NAME}`;
const STORES_ID_IMAGE_ENDPOINT_NAME = `${STORES_ID_URL_PARAMETER}/image`;
export const STORES_ID_IMAGE_ENDPOINT = `${STORES_ENDPOINT}/${STORES_ID_IMAGE_ENDPOINT_NAME}`;

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
    return this.storesService.findOne({ where: { id } });
  }

  @ApiOperation({ summary: 'get all stores' })
  @Get()
  @ApiPaginationResponse(Store, {
    description: 'Stores have been found',
    status: HttpStatus.OK,
  })
  findAll(
    @Query() filterPaginationOptionsDto: FilterPaginationOptionsDto,
  ): Promise<PageDto<Store>> {
    return this.storesService.findManyPaginated(filterPaginationOptionsDto, {
      where: {
        name: ILike(`%${filterPaginationOptionsDto.filter}%`),
      },
    });
  }

  @ApiOperation({ summary: 'get wines of store' })
  @Get(STORES_ID_WINES_ENDPOINT_NAME)
  @ApiPaginationResponse(Wine, {
    description: 'Wines of the store',
    status: HttpStatus.OK,
  })
  @ApiNotFoundResponse({
    description: 'Store could not be found',
  })
  async findAllWines(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
    @Query() filterPaginationOptionsDto: FilterPaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    const store: Store = await this.storesService.findOne({
      where: {
        id,
      },
    });
    return await this.storesService.findWinesPaginated(
      store,
      filterPaginationOptionsDto,
      {
        where: {
          name: ILike(`%${filterPaginationOptionsDto.filter}%`),
        },
      },
    );
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

  @ApiOperation({ summary: 'update image' })
  @Put(STORES_ID_IMAGE_ENDPOINT_NAME)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image of the store',
    type: FileUploadDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async updateImage(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'jpeg',
        })
        .addMaxSizeValidator({
          maxSize: FILE_MAX_SIZE,
        })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    const store: Store = await this.storesService.findOne({ where: { id } });
    await this.storesService.updateImage(store, file.buffer);
  }
}
