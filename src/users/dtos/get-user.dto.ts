import { PickType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class GetUserDto extends PickType(User, ['username'] as const) {}
