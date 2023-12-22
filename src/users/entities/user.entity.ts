import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
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
    example: 'hans',
    description: 'name of the user',
    type: String,
    minLength: 3,
    maxLength: 20,
    pattern: '/^[a-zA-Z0-9_]{3,20}$/',
  })
  @Column({ unique: true })
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message:
      'username must can be 3-20 characters long and can only include letters or underscores, but no spaces',
  })
  username: string;

  @Column()
  passwordHash: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'friends',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'friendId', referencedColumnName: 'id' },
  })
  friends: User[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'sent_friend_requests',
    joinColumn: { name: 'senderId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'receiverId', referencedColumnName: 'id' },
  })
  sentFriendRequests: User[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'received_friend_requests',
    joinColumn: { name: 'receiverId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'senderId', referencedColumnName: 'id' },
  })
  receivedFriendRequests: User[];

  @ApiProperty({
    readOnly: true,
    example: new Date(),
    description: 'createdAt',
    type: Date,
  })
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
