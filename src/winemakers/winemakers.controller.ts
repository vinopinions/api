import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWineMakerDto } from './dtos/create-winemaker.dto';
import { WinemakersService } from './winemakers.service';

@Controller('winemakers')
@ApiTags('winemakers')
@ApiBearerAuth()
export class WinemakersController {
  constructor(private winemakersService: WinemakersService) {}

  @ApiOperation({ summary: 'get winemaker by id' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.winemakersService.findOne({ where: { id } });
  }

  @ApiOperation({ summary: 'get all winemakers' })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.winemakersService.findMany();
  }

  @ApiOperation({ summary: 'create a winemaker' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createWinemakersDto: CreateWineMakerDto) {
    return this.winemakersService.create(createWinemakersDto.name);
  }
}
