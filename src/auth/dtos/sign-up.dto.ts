import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    description: 'Firebase ID Token of the user',
    type: String,
  })
  @IsString()
  firebaseToken: string;

  @ApiProperty({
    description: 'username the user wants to use',
    type: String,
  })
  @IsString()
  username: string;
}
