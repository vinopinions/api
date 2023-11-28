import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Wine {
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
    example: 'Scheurebe',
    description: 'name of the wine',
    type: String,
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 2017,
    description: 'year of the wine',
    type: Number,
  })
  @Matches(/^(?:[1-9]\d{3})$/, {
    message: 'Year must be a valid year',
  })
  @Column()
  year: number;

  @ApiProperty({
    example: 'Sina Mertz',
    description: 'winemaker of the wine',
    type: String,
  })
  @Column()
  winemaker: string;

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
