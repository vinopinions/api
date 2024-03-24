import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rating } from '../../ratings/entities/rating.entity';
import { Store } from '../../stores/entities/store.entity';
import { Winemaker } from '../../winemakers/entities/winemaker.entity';

@Entity()
export class Wine {
  @ApiProperty({
    description: 'uuid',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Scheurebe',
    description: 'Name of the wine',
    type: String,
  })
  @IsString()
  @Column()
  name: string;

  @ApiProperty({
    example: 2017,
    description: 'Year of the wine',
    type: Number,
  })
  @IsNumber()
  @Column()
  year: number;

  @ApiProperty({
    example: 'Scheurebe',
    description: 'The wines grape variety',
    type: String,
  })
  @IsString()
  @Column()
  grapeVariety: string;

  @ApiProperty({
    example: 'Rheinhessen',
    description: 'The wines heritage',
    type: String,
  })
  @IsString()
  @Column()
  heritage: string;

  @ApiProperty({
    description: 'Image of the store',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiProperty({
    description: 'The winemaker of the wine',
    type: Winemaker,
  })
  @ManyToOne(() => Winemaker, (winemaker) => winemaker.wines, { eager: true })
  winemaker: Winemaker;

  @Exclude()
  @ManyToMany(() => Store, (store) => store.wines, {
    nullable: false,
  })
  @JoinTable({
    name: 'store_wine',
    joinColumn: {
      name: 'wineId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'storeId',
      referencedColumnName: 'id',
    },
  })
  stores: Store[];

  @Exclude()
  @OneToMany(() => Rating, (rating) => rating.wine)
  ratings: Rating[];

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
