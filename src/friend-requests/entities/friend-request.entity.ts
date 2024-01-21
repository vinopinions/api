import { ApiProperty } from '@nestjs/swagger';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class FriendRequest {
  @ApiProperty({
    readOnly: true,
    example: 'uuid',
    description: 'uuid',
    type: String,
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    readOnly: true,
    example: User,
    description: 'The user who received the friend request',
    type: User,
  })
  @ManyToOne(() => User)
  receiver: User;

  @ApiProperty({
    readOnly: true,
    example: User,
    description: 'The user who sent the friend request',
    type: User,
  })
  @ManyToOne(() => User)
  sender: User;

  @ApiProperty({
    readOnly: true,
    example: new Date(),
    description: 'createdAt',
    type: Date,
  })
  @CreateDateColumn()
  createdAt: Date;
}
