import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { Public } from './auth.guard';
import { AuthService } from './auth.service';
import { CheckDto } from './dtos/check-dto';
import { CheckResponseDto } from './dtos/check-response-dto';
import { SignUpDto } from './dtos/sign-up.dto';

const AUTH_ENDPOINT_NAME = 'auth';
export const AUTH_ENDPOINT = `/${AUTH_ENDPOINT_NAME}`;
const AUTH_CHECK_ENDPOINT_NAME = 'check';
export const AUTH_CHECK_ENDPOINT = `${AUTH_ENDPOINT}/${AUTH_CHECK_ENDPOINT_NAME}`;
const AUTH_SIGNUP_ENDPOINT_NAME = 'signup';
export const AUTH_SIGNUP_ENDPOINT = `${AUTH_ENDPOINT}/${AUTH_SIGNUP_ENDPOINT_NAME}`;

@Controller(AUTH_ENDPOINT_NAME)
@ApiTags(AUTH_ENDPOINT_NAME)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post(AUTH_SIGNUP_ENDPOINT_NAME)
  @ApiOperation({ summary: 'sign up' })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  @ApiConflictResponse({
    description: 'Username is already taken',
  })
  @ApiCreatedResponse({
    description: 'A new user has been created',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<User> {
    return await this.authService.signUp(
      signUpDto.username,
      signUpDto.firebaseToken,
    );
  }

  @Public()
  @Post(AUTH_CHECK_ENDPOINT_NAME)
  @ApiOperation({ summary: 'check if the user is already registered' })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  @ApiOkResponse({
    description: 'Determined if the user exists on the backend system',
  })
  async check(@Body() checkDto: CheckDto): Promise<CheckResponseDto> {
    return { exists: await this.authService.check(checkDto.firebaseToken) };
  }
}
