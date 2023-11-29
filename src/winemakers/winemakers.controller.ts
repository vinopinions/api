import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateWineMakerDto } from './dtos/create-winemaker.dto';
import { WinemakersService } from './winemakers.service';

@Controller('winemakers')
@ApiTags('winemakers')
export class WinemakersController {
  constructor(private winemakersService: WinemakersService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.winemakersService.findAll();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createWinemakersDto: CreateWineMakerDto) {
    return this.winemakersService.create(createWinemakersDto.name);
  }
}
