import { IsString, IsUUID } from 'class-validator';

class FriendRequestAcceptedDto {
  @IsUUID()
  accepteeId: string;

  @IsString()
  accepterName: string;
}

export default FriendRequestAcceptedDto;
