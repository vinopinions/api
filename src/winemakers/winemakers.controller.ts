import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateWineMakerDto } from './dtos/create-winemaker.dto';
import { WinemakersService } from './winemakers.service';

@Controller('winemakers')
@ApiTags('winemakers')
@ApiBearerAuth()
export class WinemakersController {
  constructor(private winemakersService: WinemakersService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.winemakersService.findOne({ where: { id } });
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.winemakersService.findMany();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createWinemakersDto: CreateWineMakerDto) {
    return this.winemakersService.create(createWinemakersDto.name);
  }
}
