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
import { CreateWineDto } from './dtos/create-wine.dto';
import { WinesService } from './wines.service';

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
}
