import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ILike } from 'typeorm';
import { FileUploadDto } from '../common/dtos/FileUploadDto';
import {
  FRIEND_USERNAME_URL_PARAMETER,
  FRIEND_USERNAME_URL_PARAMETER_NAME,
  ID_URL_PARAMETER_NAME,
  USERNAME_URL_PARAMETER,
} from '../constants/url-parameter';
import { ApiPaginationResponse } from '../pagination/ApiPaginationResponse';
import { FilterPaginationOptionsDto } from '../pagination/filter-pagination-options.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { Rating } from '../ratings/entities/rating.entity';
import { FILE_MAX_SIZE } from '../s3/constants';
import { Wine } from '../wines/entities/wine.entity';
import { AuthenticatedRequest } from './../auth/auth.guard';
import { PageDto } from './../pagination/page.dto';
import { AddWineToShelfDto } from './dtos/add-wine-to-shelf.dto';
import { GetUserDto } from './dtos/get-user.dto';
import { RegisterPushTokenDto } from './dtos/register-push-token.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

const USERS_ENDPOINT_NAME = 'users';
export const USERS_ENDPOINT = `/${USERS_ENDPOINT_NAME}`;
const USERS_USERNAME_ENDPOINT_NAME = USERNAME_URL_PARAMETER;
export const USERS_USERNAME_ENDPOINT = `${USERS_ENDPOINT}/${USERS_USERNAME_ENDPOINT_NAME}`;
const USERS_USERNAME_FRIENDS_ENDPOINT_NAME = `${USERS_USERNAME_ENDPOINT_NAME}/friends`;
export const USERS_USERNAME_FRIENDS_ENDPOINT = `${USERS_ENDPOINT}/${USERS_USERNAME_FRIENDS_ENDPOINT_NAME}`;
const USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT_NAME = `${USERS_USERNAME_FRIENDS_ENDPOINT_NAME}/${FRIEND_USERNAME_URL_PARAMETER}`;
export const USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT = `${USERS_ENDPOINT}/${USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT_NAME}`;
const USERS_USERNAME_RATINGS_ENDPOINT_NAME = `${USERS_USERNAME_ENDPOINT_NAME}/ratings`;
export const USERS_USERNAME_RATINGS_ENDPOINT = `${USERS_ENDPOINT}/${USERS_USERNAME_RATINGS_ENDPOINT_NAME}`;
const USERS_USERNAME_SHELF_ENDPOINT_NAME = `${USERS_USERNAME_ENDPOINT_NAME}/shelf`;
export const USERS_USERNAME_SHELF_ENDPOINT = `${USERS_ENDPOINT}/${USERS_USERNAME_SHELF_ENDPOINT_NAME}`;
const USERS_ME_ENDPOINT_NAME = 'me';
export const USERS_ME_ENDPOINT = `${USERS_ENDPOINT}/${USERS_ME_ENDPOINT_NAME}`;
const USERS_ME_PROFILE_PICTURE_ENDPOINT_NAME = `${USERS_ME_ENDPOINT_NAME}/profilePicture`;
export const USERS_ME_PROFILE_PICTURE_ENDPOINT = `${USERS_ENDPOINT}/${USERS_ME_PROFILE_PICTURE_ENDPOINT_NAME}`;
const USERS_ME_SHELF_ENDPOINT_NAME = `${USERS_ME_ENDPOINT_NAME}/shelf`;
export const USERS_ME_SHELF_ENDPOINT = `${USERS_ENDPOINT}/${USERS_ME_SHELF_ENDPOINT_NAME}`;
const USERS_ME_NOTIFICATIONS_ENDPOINT_NAME = `${USERS_ENDPOINT_NAME}/notifications`;
export const USERS_ME_NOTIFICATIONS_ENDPOINT = `${USERS_ENDPOINT}/${USERS_ME_NOTIFICATIONS_ENDPOINT_NAME}`;

@Controller(USERS_ENDPOINT_NAME)
@ApiTags(USERS_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'get current user' })
  @HttpCode(HttpStatus.OK)
  @Get(USERS_ME_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'User has been found',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  getCurrentUser(@Req() request: AuthenticatedRequest): Promise<User> {
    return this.usersService.findOne({
      where: { username: request.user.username },
    });
  }

  @ApiOperation({ summary: 'update profile picture' })
  @Put(USERS_ME_PROFILE_PICTURE_ENDPOINT_NAME)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image of the store',
    type: FileUploadDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePicture(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'jpeg',
        })
        .addMaxSizeValidator({
          maxSize: FILE_MAX_SIZE,
        })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    const user: User = await this.usersService.findOne({
      where: { username: request.user.username },
    });
    this.usersService.updateProfilePicture(user, file.buffer);
  }

  @ApiOperation({ summary: 'get shelf of user' })
  @Get(USERS_ME_SHELF_ENDPOINT_NAME)
  @ApiPaginationResponse(Wine, {
    description: 'Shelf of user have been found',
    status: HttpStatus.OK,
  })
  async findShelfOfUser(
    @Req() request: AuthenticatedRequest,
    @Query() paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    return await this.usersService.findShelfPaginated(
      request.user,
      paginationOptionsDto,
    );
  }

  @ApiOperation({ summary: 'add wine to shelf of user' })
  @Post(USERS_ME_SHELF_ENDPOINT_NAME)
  @ApiBadRequestResponse({
    description: 'Request body was in invalid format',
  })
  @ApiNotFoundResponse({
    description: 'Wine could not be found',
  })
  @ApiConflictResponse({
    description: 'Wine was already added to the shelf',
  })
  @ApiCreatedResponse({
    description: 'Wine has been added to the shelf',
  })
  async addWineToShelfOfUser(
    @Req() request: AuthenticatedRequest,
    @Body() { id }: AddWineToShelfDto,
  ): Promise<void> {
    return await this.usersService.addWineToShelf(request.user, id);
  }

  @ApiOperation({ summary: 'remove wine from shelf of user' })
  @Delete(USERS_ME_SHELF_ENDPOINT_NAME)
  @ApiBadRequestResponse({
    description: 'Request body was in invalid format',
  })
  @ApiNotFoundResponse({
    description: 'Wine could not be found',
  })
  @ApiConflictResponse({
    description: 'Wine was not present in the shelf',
  })
  @ApiOkResponse({
    description: 'Wine has been removed from the shelf',
  })
  async removeWineFromShelfOfUser(
    @Req() request: AuthenticatedRequest,
    @Body() { id }: AddWineToShelfDto,
  ): Promise<void> {
    return await this.usersService.removeWineFromShelf(request.user, id);
  }

  @ApiOperation({ summary: 'get all users' })
  @Get()
  @ApiPaginationResponse(User, {
    description: 'Users have been found',
    status: HttpStatus.OK,
  })
  findAll(
    @Query() filterPaginationOptionsDto: FilterPaginationOptionsDto,
  ): Promise<PageDto<User>> {
    return this.usersService.findManyPaginated(filterPaginationOptionsDto, {
      where: {
        username: ILike(`%${filterPaginationOptionsDto.filter}%`),
      },
    });
  }

  @ApiOperation({ summary: 'get information about a user' })
  @HttpCode(HttpStatus.OK)
  @Get(USERS_USERNAME_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'User has been found',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  findByName(@Param() { username }: GetUserDto): Promise<User> {
    return this.usersService.findOne({
      where: {
        username,
      },
    });
  }

  @ApiOperation({ summary: 'get friends of a user' })
  @HttpCode(HttpStatus.OK)
  @Get(USERS_USERNAME_FRIENDS_ENDPOINT_NAME)
  @ApiPaginationResponse(User, {
    description: 'Friend of user have been found',
    status: HttpStatus.OK,
  })
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  async findFriends(
    @Param() { username }: GetUserDto,
    @Query() filterPaginationOptionsDto: FilterPaginationOptionsDto,
  ): Promise<PageDto<User>> {
    const user: User = await this.usersService.findOne({
      where: {
        username,
      },
    });
    return await this.usersService.findFriendsPaginated(
      user,
      filterPaginationOptionsDto,
      {
        where: {
          username: ILike(`%${filterPaginationOptionsDto.filter}%`),
        },
      },
    );
  }

  @ApiOperation({ summary: 'get ratings of a user' })
  @HttpCode(HttpStatus.OK)
  @Get(USERS_USERNAME_RATINGS_ENDPOINT_NAME)
  @ApiPaginationResponse(User, {
    description: 'Friend of user have been found',
    status: HttpStatus.OK,
  })
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  async findRatingsOfUser(
    @Param() { username }: GetUserDto,
    @Query() paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    const user: User = await this.usersService.findOne({
      where: {
        username,
      },
    });
    return await this.usersService.findRatingsPaginated(
      user,
      paginationOptionsDto,
    );
  }

  @ApiOperation({ summary: 'get shelf of a user' })
  @Get(USERS_USERNAME_SHELF_ENDPOINT_NAME)
  @ApiPaginationResponse(Wine, {
    description: 'Shelf of user have been found',
    status: HttpStatus.OK,
  })
  @ApiNotFoundResponse({
    description: 'User could not be found',
  })
  async findShelfOfAnotherUser(
    @Param() { username }: GetUserDto,
    @Query() paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    const user: User = await this.usersService.findOne({
      where: {
        username,
      },
    });
    return await this.usersService.findShelfPaginated(
      user,
      paginationOptionsDto,
    );
  }

  @ApiOperation({ summary: 'check friendship' })
  @Get(USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Friendship has been found',
  })
  @ApiNotFoundResponse({
    description: 'User has not been found or is not a friend',
  })
  async isFriend(
    @Param() { username }: GetUserDto,
    @Param(FRIEND_USERNAME_URL_PARAMETER_NAME) friendUsername: string,
  ): Promise<void> {
    // this throws a NotFoundException if the friendship or user doesn't exist
    await this.usersService.findOne({
      where: {
        username: username,
        friends: {
          username: friendUsername,
        },
      },
    });
  }

  @ApiOperation({ summary: 'remove a friend' })
  @HttpCode(HttpStatus.OK)
  @Delete(USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Friend has been deleted',
  })
  @ApiForbiddenResponse({
    description: 'You can not delete another users friendship',
  })
  @ApiNotFoundResponse({
    description: 'User has not been found or is not a friend',
  })
  async removeFriend(
    @Param() { username }: GetUserDto,
    @Param(FRIEND_USERNAME_URL_PARAMETER_NAME) friendUsername: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    const removingUser: User = await this.usersService.findOne({
      where: {
        username,
      },
    });

    if (removingUser.id !== request.user.id)
      throw new ForbiddenException('You can not delete another users friend');

    const toBeRemovedUser: User = await this.usersService.findOne({
      where: {
        username: friendUsername,
      },
    });

    await this.usersService.removeFriend(removingUser, toBeRemovedUser);
  }

  @ApiOperation({ summary: 'add a notification push token' })
  @Post(USERS_ME_NOTIFICATIONS_ENDPOINT_NAME)
  async registerPushToken(
    @Req() { user }: AuthenticatedRequest,
    @Body() { pushToken }: RegisterPushTokenDto,
  ) {
    await this.usersService.registerPushToken(user, pushToken);
  }

  @ApiOperation({ summary: 'revoke a notification push token' })
  @Delete(USERS_ME_NOTIFICATIONS_ENDPOINT_NAME)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokePushToken(
    @Req() { user }: AuthenticatedRequest,
    @Body() { pushToken }: RegisterPushTokenDto,
  ) {
    await this.usersService.revokePushToken(user, pushToken);
  }
}
