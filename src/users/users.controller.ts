import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'get all user' })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.usersService.findMany();
  }

  @ApiOperation({ summary: 'get ratings by a user' })
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

  @HttpCode(HttpStatus.OK)
  @Delete(':name/friends/:friendName')
  async removeFriend(
    @Param('name') username: string,
    @Param('friendName') friendUsername: string,
  ) {
    const removingUser: User = await this.usersService.findOne({
      where: {
        username,
      },
    });

    const toBeRemovedUser: User = await this.usersService.findOne({
      where: {
        username: friendUsername,
      },
    });

    return await this.usersService.removeFriend(removingUser, toBeRemovedUser);
  }

  @Get(':id/ratings')
  getRatings(@Param('id') id: string) {
    return this.usersService.getRatings(id);
  }
}
