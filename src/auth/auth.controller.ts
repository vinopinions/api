import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from './auth.guard';
import { AuthService } from './auth.service';
import { SignInResponseDto } from './dtos/sign-in-response.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: SignInResponseDto,
  })
  signIn(@Body() signInDto: SignInDto): Promise<SignInResponseDto> {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('signup')
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  @ApiConflictResponse({
    description: 'Username is already taken',
  })
  @ApiCreatedResponse({
    description: 'A new user has been created',
  })
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto.username, signUpDto.password);
  }
}
