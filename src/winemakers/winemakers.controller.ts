import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateWineMakerDto } from './dtos/create-winemaker.dto';
import { Winemaker } from './entities/winemaker.entity';
import { WinemakersService } from './winemakers.service';

@Controller('winemakers')
@ApiTags('winemakers')
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
export class WinemakersController {
  constructor(private winemakersService: WinemakersService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  @ApiOkResponse({
    description: 'Winemaker has been found',
    type: Winemaker,
  })
  @ApiNotFoundResponse({
    description: 'Winemaker has not been found',
  })
  findById(@Param('id') id: string): Promise<Winemaker> {
    return this.winemakersService.findOne({ where: { id } });
  }

  @ApiOkResponse({
    description: 'Winemakers have been found',
    type: Winemaker,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(): Promise<Winemaker[]> {
    return this.winemakersService.findMany();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiCreatedResponse({
    description: 'Winemaker has been created',
    type: Winemaker,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() createWinemakersDto: CreateWineMakerDto) {
    return this.winemakersService.create(createWinemakersDto.name);
  }
}
