import { ApiProperty } from '@nestjs/swagger';
import { Wine } from 'src/wines/entities/wine.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Winemaker {
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
    example: 'Sina Mertz',
    description: 'name of the winemaker',
    type: String,
  })
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Wine, (wine) => wine.winemaker)
  wines: Wine[];

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
