import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Rating } from '../ratings/entities/rating.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'get all user' })
  @HttpCode(HttpStatus.OK)
  @Get()
  @ApiOkResponse({
    description: 'Users have been found',
    type: User,
    isArray: true,
  })
  findAll(): Promise<User[]> {
    return this.usersService.findMany();
  }

  @ApiOperation({ summary: 'get information about a user' })
  @HttpCode(HttpStatus.OK)
  @Get(':name')
  @ApiOkResponse({
    description: 'User has been found',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  findByName(@Param('name') username: string): Promise<User> {
    return this.usersService.findOne({
      where: {
        username,
      },
    });
  }

  @ApiOperation({ summary: 'get friends of a user' })
  @HttpCode(HttpStatus.OK)
  @Get(':name/friends')
  @ApiOkResponse({
    description: 'Friends for the user have been found',
    type: User,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  async getFriends(@Param('name') username: string): Promise<User[]> {
    const user: User = await this.usersService.findOne({
      where: {
        username,
      },
    });
    return this.usersService.getFriends(user);
  }

  @ApiOperation({ summary: 'remove a friend' })
  @HttpCode(HttpStatus.OK)
  @Delete(':name/friends/:friendName')
  @ApiOkResponse({
    description: 'Friend has been deleted',
  })
  @ApiNotFoundResponse({
    description: 'User has not been found or is not a friend',
  })
  async removeFriend(
    @Param('name') username: string,
    @Param('friendName') friendUsername: string,
  ): Promise<void> {
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

<<<<<<< HEAD
  @Get(':name/ratings')
  @ApiOkResponse({
    description: 'Ratings have been found',
    type: Rating,
    isArray: true,
  })
  getRatings(@Param('name') username: string): Promise<Rating[]> {
    return this.usersService.getRatings(username);
=======
  @ApiOperation({ summary: 'get ratings by a user' })
  @Get(':id/ratings')
  getRatings(@Param('id') id: string) {
    return this.usersService.getRatings(id);
>>>>>>> developer
  }
}
