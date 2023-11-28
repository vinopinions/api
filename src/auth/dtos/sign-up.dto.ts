import { ApiProperty, PickType } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class SignUpDto extends PickType(User, ['username'] as const) {
  @ApiProperty({
    example: 'JfK9pC^2Uq4&sn',
    description: 'password of the user',
    type: String,
  })
  password: string;
}
