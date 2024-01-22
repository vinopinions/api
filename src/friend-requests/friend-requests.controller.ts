import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { UsersService } from '../users/users.service';
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { FriendRequestsService } from './friend-requests.service';

@Controller('friend-requests')
@ApiTags('friend requests')
@ApiBearerAuth()
export class FriendRequestsController {
  constructor(
    private friendRequestsService: FriendRequestsService,
    private usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Send a friend request' })
  @HttpCode(HttpStatus.OK)
  @Post('send')
  async send(
    @Req() request: AuthenticatedRequest,
    @Body() sendFriendRequestDto: SendFriendRequestDto,
  ) {
    const user: User = await this.usersService.findOne({
      where: { username: sendFriendRequestDto.to },
    });
    return await this.friendRequestsService.sendFriendRequest(
      request.user,
      user,
    );
  }

  @ApiOperation({ summary: 'Accept a sent friend request sent to you' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/accept')
  async accept(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.friendRequestsService.acceptFriendRequest(id, request.user);
  }

  @ApiOperation({ summary: 'Decline a sent friend request sent to you' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/decline')
  async decline(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.friendRequestsService.declineFriendRequest(id, request.user);
  }

  @ApiOperation({ summary: 'Get all friend requests sent to you' })
  @HttpCode(HttpStatus.OK)
  @Get('incoming')
  async getIncoming(@Req() request: AuthenticatedRequest) {
    return await this.friendRequestsService.getReceivedFriendRequests(
      request.user,
    );
  }

  @ApiOperation({ summary: 'Get all friend requests sent by you' })
  @HttpCode(HttpStatus.OK)
  @Get('outgoing')
  async getOutgoing(@Req() request: AuthenticatedRequest) {
    return await this.friendRequestsService.getSentFriendRequests(request.user);
  }

  @ApiOperation({ summary: 'Revoke a friend request sent by you' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id/revoke')
  async revoke(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    await this.friendRequestsService.revokeFriendRequest(id, request.user);
  }
}
