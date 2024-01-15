import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateStoreDto } from './dtos/create-store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
@ApiTags('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

  @ApiOperation({ summary: 'get store by id' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.storesService.findOneById(id);
  }

  @ApiOperation({ summary: 'get all stores' })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @ApiOperation({ summary: 'create a store' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(
      createStoreDto.name,
      createStoreDto.address,
      createStoreDto.url,
    );
  }
}
