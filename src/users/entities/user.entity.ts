import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsDate, IsOptional, IsUUID, IsUrl, Matches } from 'class-validator';
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
import { Wine } from '../../wines/entities/wine.entity';

export const USERNAME_REGEX = /^([a-z]+[a-z0-9]*([\._][a-z0-9]+)?){3,20}$/;
const USERNAME_REGEX_PATTERN = USERNAME_REGEX.toString().substring(
  1,
  USERNAME_REGEX.toString().length - 1,
);

@Entity()
export class User {
  @ApiProperty({
    description: 'uuid',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The firebase id of the user',
  })
  @Exclude()
  @Column({ unique: true })
  firebaseId: string;

  @ApiProperty({
    example: 'hans',
    description: 'name of the user',
    type: String,
    minLength: 3,
    maxLength: 20,
    pattern: USERNAME_REGEX_PATTERN,
  })
  @Matches(USERNAME_REGEX, {
    message:
      'username must be defined, has to be lowercase, 3-20 characters long and can only include letters, underscores and dots, but no spaces',
  })
  @Column({ unique: true })
  username: string;

  @Exclude()
  @ManyToMany(() => User)
  @JoinTable()
  friends: User[];

  @Exclude()
  @OneToMany(() => Rating, (rating: Rating) => rating.user)
  ratings: Rating[];

  @ApiProperty({
    description: 'Profile picture of the user',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  profilePicture?: string;

  @Exclude()
  @ManyToMany(() => Wine, (wine) => wine.shelfUser)
  @JoinTable()
  shelf: Wine[];

  @ApiProperty({
    description: 'createdAt',
    type: Date,
  })
  @IsDate()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'updatedAt',
    type: Date,
  })
  @IsDate()
  @UpdateDateColumn()
  updatedAt: Date;
}
