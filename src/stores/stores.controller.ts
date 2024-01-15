import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateStoreDto } from './dtos/create-store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
@ApiTags('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.storesService.findOne({ where: { id } });
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.storesService.findAll();
  }

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
