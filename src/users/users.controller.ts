import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { FriendRequestsService } from '../friend-requests/friend-requests.service';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private friendRequestsService: FriendRequestsService,
  ) {}

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
  async getFriends(@Param('name') name: string) {
    console.log(name);
    const user: User = await this.usersService.findOneByUsername(name);
    return this.usersService.getFriends(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':name/friends/friend-requests')
  async sendFriendRequest(
    @Req() request: AuthenticatedRequest,
    @Param('name') name: string,
  ) {
    const user: User = await this.usersService.findOneByUsername(name);
    return this.friendRequestsService.sendFriendRequest(request.user, user);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':name/friends/friend-requests/incoming')
  async getIncomingFriendRequest(
    @Req() request: AuthenticatedRequest,
    @Param('name') name: string,
  ) {
    const requester: User = await this.usersService.findOneByUsername(name);
    if (requester.id !== request.user.id)
      throw new UnauthorizedException(
        'You can not view another users friend requests',
      );
    return this.friendRequestsService.getReceivedFriendRequests(request.user);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':name/friends/friend-requests/outgoing')
  async getOutgoingFriendRequests(
    @Req() request: AuthenticatedRequest,
    @Param('name') name: string,
  ) {
    const requester: User = await this.usersService.findOneByUsername(name);
    if (requester.id !== request.user.id)
      throw new UnauthorizedException(
        'You can not view another users friend requests',
      );
    return this.friendRequestsService.getSentFriendRequests(request.user);
  }
}
