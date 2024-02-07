import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsString, IsUUID, Max, Min } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Wine } from '../../wines/entities/wine.entity';

export const STARS_MIN = 1;
export const STARS_MAX = 5;

@Entity()
export class Rating {
  @ApiProperty({
    description: 'uuid',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Amount of stars the user submitted',
    type: Number,
    example: 2,
  })
  @IsInt()
  @Min(STARS_MIN)
  @Max(STARS_MAX)
  @Column({ type: 'int' })
  stars: number;

  @ApiProperty({
    description: 'Text in addition to the submitted stars',
    type: String,
  })
  @IsString()
  @Column()
  text: string;

  @ApiProperty({
    description: 'The rated Wine',
    type: User,
  })
  @ManyToOne(() => Wine, (wine) => wine.ratings)
  wine: Wine;

  @ApiProperty({
    description: 'The User that submitted the rating',
    type: () => User,
  })
  @ManyToOne(() => User, (user: User) => user.ratings)
  user: User;

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
