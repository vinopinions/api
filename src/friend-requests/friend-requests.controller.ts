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
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { FriendRequest } from './entities/friend-request.entity';
import { FriendRequestsService } from './friend-requests.service';

const FRIEND_REQUESTS_ENDPOINT_NAME = 'friend-requests';
export const FRIEND_REQUESTS_ENDPOINT = `/${FRIEND_REQUESTS_ENDPOINT_NAME}`;
const FRIEND_REQUESTS_INCOMING_ENDPOINT_NAME = 'incoming';
export const FRIEND_REQUESTS_INCOMING_ENDPOINT = `${FRIEND_REQUESTS_ENDPOINT}/${FRIEND_REQUESTS_INCOMING_ENDPOINT_NAME}`;
const FRIEND_REQUESTS_OUTGOING_ENDPOINT_NAME = 'outgoing';
export const FRIEND_REQUESTS_OUTGOING_ENDPOINT = `${FRIEND_REQUESTS_ENDPOINT}/${FRIEND_REQUESTS_OUTGOING_ENDPOINT_NAME}`;
const FRIEND_REQUESTS_SEND_ENDPOINT_NAME = 'send';
export const FRIEND_REQUESTS_SEND_ENDPOINT = `${FRIEND_REQUESTS_ENDPOINT}/${FRIEND_REQUESTS_SEND_ENDPOINT_NAME}`;

@Controller(FRIEND_REQUESTS_ENDPOINT_NAME)
@ApiTags(FRIEND_REQUESTS_ENDPOINT.replace('-', ' '))
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class FriendRequestsController {
  constructor(
    private friendRequestsService: FriendRequestsService,
    private usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'get all friend requests sent to you' })
  @Get(FRIEND_REQUESTS_INCOMING_ENDPOINT_NAME)
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
  @Get(FRIEND_REQUESTS_OUTGOING_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Outgoing friend requests have been found',
    type: FriendRequest,
    isArray: true,
  })
  async getOutgoing(@Req() request: AuthenticatedRequest) {
    return await this.friendRequestsService.getSentFriendRequests(request.user);
  }
  @ApiOperation({ summary: 'send a friend request' })
  @Post(FRIEND_REQUESTS_SEND_ENDPOINT_NAME)
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  @ApiConflictResponse({
    description: 'A friend request already exists between the 2 users',
  })
  @ApiCreatedResponse({
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
