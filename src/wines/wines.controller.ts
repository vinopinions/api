import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateWineDto } from './dtos/create-wine.dto';
import { WinesService } from './wines.service';
import { AddStoreToWineDto } from './dtos/add-store-to-wine.dto';

@Controller('wines')
@ApiTags('wines')
export class WinesController {
  constructor(private wineService: WinesService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.wineService.findOneById(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.wineService.findAll();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createWineDto: CreateWineDto) {
    return this.wineService.create(createWineDto);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  addStores(
    @Param('id') id: string,
    @Body() addStoreToWineDto: AddStoreToWineDto,
  ) {
    return this.wineService.addStores(id, addStoreToWineDto);
  }
}
