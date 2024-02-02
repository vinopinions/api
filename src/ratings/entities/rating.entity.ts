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
    readOnly: true,
    example: 'uuid',
    description: 'uuid',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    readOnly: true,
    example: 2,
    description: 'Ammount of stars the user submitted',
    type: Number,
  })
  @IsInt()
  @Min(STARS_MIN)
  @Max(STARS_MAX)
  @Column({ type: 'int' })
  stars: number;

  @ApiProperty({
    readOnly: true,
    example: 'meh',
    description: 'Text in addition to the submitted stars',
    type: String,
  })
  @IsString()
  @Column()
  text: string;

  @ApiProperty({
    readOnly: true,
    example: Wine,
    description: 'The rated Wine',
    type: Wine,
  })
  @ManyToOne(() => Wine, (wine) => wine.ratings)
  wine: Wine;

  @ApiProperty({
    readOnly: true,
    example: User,
    description: 'The User that submitted the rating',
    type: () => User,
  })
  @ManyToOne(() => User, (user: User) => user.ratings)
  user: User;

  @ApiProperty({
    readOnly: true,
    example: new Date(),
    description: 'createdAt',
    type: Date,
  })
  @IsDate()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    readOnly: true,
    example: new Date(),
    description: 'updatedAt',
    type: Date,
  })
  @IsDate()
  @UpdateDateColumn()
  updatedAt: Date;
}
