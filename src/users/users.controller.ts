import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':name')
  findByName(@Param('name') name: string) {
    return this.usersService.findOneByUsername(name);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @HttpCode(HttpStatus.OK)
  @Get(':name/friends')
  async findFriends(@Param('name') name: string) {
    const user: User = await this.usersService.findOneByUsername(name);
    return this.usersService.getFriends(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':name/friends')
  async sendFriendRequest(
    @Req() request: AuthenticatedRequest,
    @Param('name') name: string,
  ) {
    const user: User = await this.usersService.findOneByUsername(name);
    return this.usersService.sendFriendRequest(request.user, user);
  }
}
