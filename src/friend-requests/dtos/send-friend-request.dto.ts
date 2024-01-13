import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({
    example: 'bauerpeter',
    description: 'name of the user you want to sent a friend request to',
    type: String,
  })
  @IsUUID()
  to: string;
}
