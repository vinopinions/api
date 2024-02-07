import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID } from 'class-validator';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User, UserWithoutRelations } from '../../users/entities/user.entity';

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
    type: UserWithoutRelations,
  })
  @ManyToOne(() => User)
  receiver: User;

  @ApiProperty({
    description: 'The user who sent the friend request',
    type: UserWithoutRelations,
  })
  @ManyToOne(() => User)
  sender: User;

  @ApiProperty({
    description: 'createdAt',
    type: Date,
  })
  @IsDate()
  @CreateDateColumn()
  createdAt: Date;
}
