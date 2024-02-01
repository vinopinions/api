import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignInResponseDto {
  @ApiProperty({
    example: 'jwt',
  })
  @IsString()
  access_token: string;
}
