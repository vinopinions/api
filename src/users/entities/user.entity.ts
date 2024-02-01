import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Matches } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rating } from '../../ratings/entities/rating.entity';

const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/;

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
    pattern: USERNAME_REGEX.toString(),
  })
  @Column({ unique: true })
  @Matches(USERNAME_REGEX, {
    message:
      'username must can be 3-20 characters long and can only include letters, underscores and dots, but no spaces',
  })
  username: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'friends',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'friendId', referencedColumnName: 'id' },
  })
  friends: User[];
  @OneToMany(() => Rating, (rating: Rating) => rating.user)
  ratings: Rating[];

  @ApiProperty({
    readOnly: true,
    example: new Date(),
    description: 'createdAt',
    type: Date,
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    readOnly: true,
    example: new Date(),
    description: 'updatedAt',
    type: Date,
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
