import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from './auth.guard';
import { AuthService } from './auth.service';
import { SignInResponseDto } from './dtos/sign-in-response.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';

const AUTH_ENDPOINT_NAME = 'auth';
export const AUTH_ENDPOINT = `/${AUTH_ENDPOINT_NAME}`;
const AUTH_LOGIN_ENDPOINT_NAME = 'login';
export const AUTH_LOGIN_ENDPOINT = `${AUTH_ENDPOINT}/${AUTH_LOGIN_ENDPOINT_NAME}`;
const AUTH_SIGNUP_ENDPOINT_NAME = 'signup';
export const AUTH_SIGNUP_ENDPOINT = `${AUTH_ENDPOINT}/${AUTH_SIGNUP_ENDPOINT_NAME}`;

@Controller(AUTH_ENDPOINT_NAME)
@ApiTags(AUTH_ENDPOINT_NAME)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post(AUTH_LOGIN_ENDPOINT_NAME)
  @ApiOperation({ summary: 'log in' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiCreatedResponse({
    description: 'Login successful',
    type: SignInResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  signIn(
    @Body()
    signInDto: SignInDto,
  ): Promise<SignInResponseDto> {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

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
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto.username, signUpDto.password);
  }
}
