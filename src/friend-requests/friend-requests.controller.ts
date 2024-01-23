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
<<<<<<< HEAD
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
=======
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
>>>>>>> developer
import { AuthenticatedRequest } from '../auth/auth.guard';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { FriendRequest } from './entities/friend-request.entity';
import { FriendRequestsService } from './friend-requests.service';

@Controller('friend-requests')
@ApiTags('friend requests')
<<<<<<< HEAD
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
=======
@ApiBearerAuth()
>>>>>>> developer
export class FriendRequestsController {
  constructor(
    private friendRequestsService: FriendRequestsService,
    private usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'send a friend request' })
  @HttpCode(HttpStatus.OK)
  @Post('send')
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  @ApiConflictResponse({
    description: 'A friend request already exists between the 2 users',
  })
  @ApiOkResponse({
    description: 'Sent a friend request',
  })
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

  @ApiOperation({ summary: 'accept a sent friend request sent to you' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/accept')
  @ApiNotFoundResponse({
    description: 'This friend request could not be found',
  })
  @ApiOkResponse({
    description: 'Friend request has been accepted',
  })
  async accept(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.friendRequestsService.acceptFriendRequest(id, request.user);
  }

  @ApiOperation({ summary: 'decline a sent friend request sent to you' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/decline')
  @ApiNotFoundResponse({
    description: 'This friend request could not be found',
  })
  @ApiOkResponse({
    description: 'Friend request has been declined',
  })
  async decline(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FriendRequest> {
    return await this.friendRequestsService.declineFriendRequest(
      id,
      request.user,
    );
  }

  @ApiOperation({ summary: 'get all friend requests sent to you' })
  @HttpCode(HttpStatus.OK)
  @Get('incoming')
  @ApiOkResponse({
    description: 'Incoming friend requests have been found',
    type: FriendRequest,
    isArray: true,
  })
  async getIncoming(
    @Req() request: AuthenticatedRequest,
  ): Promise<FriendRequest[]> {
    return await this.friendRequestsService.getReceivedFriendRequests(
      request.user,
    );
  }

  @ApiOperation({ summary: 'get all friend requests sent by you' })
  @HttpCode(HttpStatus.OK)
  @Get('outgoing')
  @ApiOkResponse({
    description: 'Outgoing friend requests have been found',
    type: FriendRequest,
    isArray: true,
  })
  async getOutgoing(@Req() request: AuthenticatedRequest) {
    return await this.friendRequestsService.getSentFriendRequests(request.user);
  }

  @ApiOperation({ summary: 'revoke a friend request sent by you' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id/revoke')
  @ApiNotFoundResponse({
    description: 'This friend request could not be found',
  })
  @ApiOkResponse({
    description: 'Friend request has been revoked',
  })
  async revoke(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    await this.friendRequestsService.revokeFriendRequest(id, request.user);
  }
}
