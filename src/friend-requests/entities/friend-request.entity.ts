import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID } from 'class-validator';
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
    description: 'uuid',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The user who received the friend request',
    type: User,
  })
  @ManyToOne(() => User, { eager: true })
  receiver: User;

  @ApiProperty({
    description: 'The user who sent the friend request',
    type: User,
  })
  @ManyToOne(() => User, { eager: true })
  sender: User;

  @ApiProperty({
    description: 'createdAt',
    type: Date,
  })
  @IsDate()
  @CreateDateColumn()
  createdAt: Date;
}
