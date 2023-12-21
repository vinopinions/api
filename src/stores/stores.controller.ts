import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dtos/create-store.dto';

@Controller('stores')
@ApiTags('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

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
