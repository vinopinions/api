import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckDto {
  @ApiProperty({
    description: 'Firebase ID Token of the user',
    type: String,
  })
  @IsString()
  firebaseToken: string;
}
