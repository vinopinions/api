import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.usersService.findMany();
  }

  @HttpCode(HttpStatus.OK)
  @Get(':name')
  findByName(@Param('name') username: string) {
    return this.usersService.findOne({
      where: {
        username,
      },
    });
  }

  @HttpCode(HttpStatus.OK)
  @Get(':name/friends')
  async getFriends(@Param('name') username: string) {
    const user: User = await this.usersService.findOne({
      where: {
        username,
      },
    });
    return this.usersService.getFriends(user);
  }

  @Get(':id/ratings')
  getRatings(@Param('id') id: string) {
    return this.usersService.getRatings(id);
  }
}
