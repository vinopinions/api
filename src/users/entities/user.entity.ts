import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rating } from '../../ratings/entities/rating.entity';

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

  @UpdateDateColumn()
  updatedAt: Date;
}
