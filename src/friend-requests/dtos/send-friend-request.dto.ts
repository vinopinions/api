import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({
    example: 'bauerpeter',
    description: 'name of the user you want to sent a friend request to',
    type: String,
  })
  @IsString()
  to: string;
}
