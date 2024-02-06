import { PickType } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class SendFriendRequestDto extends PickType(User, [
  'username',
] as const) {}
