import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wine } from '../../wines/entities/wine.entity';
import { IsInt, Max, Min } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Rating {
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
    example: 2,
    description: 'Ammount of stars the user submitted',
    type: Number,
  })
  @Column({ type: 'int' })
  @IsInt({ message: 'Stars must be an integer' })
  @Min(1, { message: 'Stars must be at least 1' })
  @Max(5, { message: 'Stars must be at most 5' })
  stars: number;

  @ApiProperty({
    readOnly: true,
    example: 'meh',
    description: 'Text in addition to the submitted stars',
    type: String,
  })
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
