import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateWineDto } from './dtos/create-wine.dto';
import { WinesService } from './wines.service';

@Controller('wines')
export class WinesController {
  constructor(private wineService: WinesService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.wineService.findAll();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createWineDto: CreateWineDto) {
    return this.wineService.create(
      createWineDto.name,
      createWineDto.year,
      createWineDto.winemaker,
    );
  }
}
