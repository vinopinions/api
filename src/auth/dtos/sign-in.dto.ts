import { PickType } from '@nestjs/swagger';
import { SignUpDto } from './sign-up.dto';

export class SignInDto extends PickType(SignUpDto, [
  'username',
  'password',
] as const) {}
