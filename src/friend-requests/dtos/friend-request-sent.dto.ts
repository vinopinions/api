import { IsString, IsUUID } from 'class-validator';

class FriendRequestSentDto {
  @IsUUID()
  receiverId: string;

  @IsString()
  senderName: string;
}

export default FriendRequestSentDto;
