import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.guard';
import {
  ID_URL_PARAMETER,
  ID_URL_PARAMETER_NAME,
} from '../constants/url-parameter';
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
const FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT_NAME = `${ID_URL_PARAMETER}/accept`;
export const FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT = `${FRIEND_REQUESTS_ENDPOINT}/${FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT_NAME}`;
const FRIEND_REQUESTS_ID_DECLINE_ENDPOINT_NAME = `${ID_URL_PARAMETER}/decline`;
export const FRIEND_REQUESTS_ID_DECLINE_ENDPOINT = `${FRIEND_REQUESTS_ENDPOINT}/${FRIEND_REQUESTS_ID_DECLINE_ENDPOINT_NAME}`;
const FRIEND_REQUESTS_ID_REVOKE_ENDPOINT_NAME = `${ID_URL_PARAMETER}/revoke`;
export const FRIEND_REQUESTS_ID_REVOKE_ENDPOINT = `${FRIEND_REQUESTS_ENDPOINT}/${FRIEND_REQUESTS_ID_REVOKE_ENDPOINT_NAME}`;

@Controller(FRIEND_REQUESTS_ENDPOINT_NAME)
@ApiTags(FRIEND_REQUESTS_ENDPOINT_NAME.replace('-', ' '))
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
    return await this.friendRequestsService.getReceived(request.user);
  }

  @ApiOperation({ summary: 'get all friend requests sent by you' })
  @Get(FRIEND_REQUESTS_OUTGOING_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Outgoing friend requests have been found',
    type: FriendRequest,
    isArray: true,
  })
  async getOutgoing(@Req() request: AuthenticatedRequest) {
    return await this.friendRequestsService.getSent(request.user);
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
      where: { username: sendFriendRequestDto.username },
    });
    await this.friendRequestsService.send(request.user, user);
  }

  @ApiOperation({ summary: 'accept a sent friend request sent to you' })
  @HttpCode(HttpStatus.OK)
  @Post(FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT_NAME)
  @ApiNotFoundResponse({
    description: 'This friend request could not be found',
  })
  @ApiForbiddenResponse({
    description: 'You can not accept another users friend request',
  })
  @ApiOkResponse({
    description: 'Friend request has been accepted',
    type: FriendRequest,
  })
  @ApiBadRequestResponse({
    description: 'Invalid uuid',
  })
  async accept(
    @Req() request: AuthenticatedRequest,
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
  ): Promise<FriendRequest> {
    return await this.friendRequestsService.accept(id, request.user);
  }

  @ApiOperation({ summary: 'decline a sent friend request sent to you' })
  @HttpCode(HttpStatus.OK)
  @Post(FRIEND_REQUESTS_ID_DECLINE_ENDPOINT_NAME)
  @ApiNotFoundResponse({
    description: 'This friend request could not be found',
  })
  @ApiForbiddenResponse({
    description: 'You can not decline another users friend request',
  })
  @ApiOkResponse({
    description: 'Friend request has been declined',
    type: FriendRequest,
  })
  @ApiBadRequestResponse({
    description: 'Invalid uuid',
  })
  async decline(
    @Req() request: AuthenticatedRequest,
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
  ): Promise<FriendRequest> {
    return await this.friendRequestsService.decline(id, request.user);
  }

  @ApiOperation({ summary: 'revoke a friend request sent by you' })
  @HttpCode(HttpStatus.OK)
  @Post(FRIEND_REQUESTS_ID_REVOKE_ENDPOINT_NAME)
  @ApiNotFoundResponse({
    description: 'This friend request could not be found',
  })
  @ApiForbiddenResponse({
    description: 'You can not revoke another users friend request',
  })
  @ApiOkResponse({
    description: 'Friend request has been revoked',
    type: FriendRequest,
  })
  @ApiBadRequestResponse({
    description: 'Invalid uuid',
  })
  async revoke(
    @Req() request: AuthenticatedRequest,
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
  ): Promise<FriendRequest> {
    return await this.friendRequestsService.revoke(id, request.user);
  }
}
