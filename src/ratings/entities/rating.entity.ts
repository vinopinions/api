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

@Entity()
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  @IsInt({ message: 'Stars must be an integer' })
  @Min(1, { message: 'Stars must be at least 1' })
  @Max(5, { message: 'Stars must be at most 5' })
  stars: number;

  @Column()
  text: string;

  @ManyToOne(() => Wine, (wine) => wine.ratings)
  wine: Wine;

  @ManyToOne(() => User, (user) => user.ratings)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
