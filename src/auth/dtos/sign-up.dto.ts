import { ApiProperty, PickType } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class SignUpDto extends PickType(User, ['username'] as const) {
  @ApiProperty({
    description: 'The firebaseToken of the user',
  })
  firebaseToken: string;
}
