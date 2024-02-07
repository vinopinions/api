import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDate, IsString, IsUUID } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wine, WineWithoutRelations } from '../../wines/entities/wine.entity';

@Entity()
export class Winemaker {
  @ApiProperty({
    description: 'uuid',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Sina Mertz',
    description: 'Name of the winemaker',
    type: String,
  })
  @IsString()
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: 'Wines of the winemaker',
    type: WineWithoutRelations,
    isArray: true,
  })
  @OneToMany(() => Wine, (wine) => wine.winemaker)
  wines: Wine[];

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

export class WinemakerWithoutRelation extends OmitType(Winemaker, ['wines']) {}
