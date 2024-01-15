import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'get user by username' })
  @HttpCode(HttpStatus.OK)
  @Get(':name')
  findByName(@Param('name') name: string) {
    return this.usersService.findOneByName(name);
  }

  @ApiOperation({ summary: 'get all user' })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'get ratings by a user' })
  @HttpCode(HttpStatus.OK)
  @Get(':id/ratings')
  getRatings(@Param('id') id: string) {
    return this.usersService.getRatings(id);
  }
}
