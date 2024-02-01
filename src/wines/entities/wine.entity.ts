import { ApiProperty } from '@nestjs/swagger';
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
import { Winemaker } from '../../winemakers/entities/winemaker.entity';
import { Store } from '../../stores/entities/store.entity';
import { Rating } from '../../ratings/entities/rating.entity';

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
  @Column()
  year: number;

  @ApiProperty({
    example: 'Scheurebe',
    description: 'the wines grape variety',
    type: String,
  })
  @Column()
  grapeVariety: string;

  @ApiProperty({
    example: 'Rheinhessen',
    description: 'the wines heritage',
    type: String,
  })
  @Column()
  heritage: string;

  @ApiProperty({
    example: {
      id: 'uuid',
      name: 'Sina Mertz',
      wines: [],
    },
    description: 'the wines winemaker',
    type: Winemaker,
  })
  @ManyToOne(() => Winemaker, (winemaker) => winemaker.wines)
  winemaker: Winemaker;

  @ApiProperty({
    example: {
      id: 'uuid',
      name: 'Wein&Gut',
      wines: [],
    },
    description: 'the store where the wine was bought at',
    type: Store,
  })
  @ManyToMany(() => Store, (store) => store.wines, {
    eager: true,
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

  @ApiProperty({
    type: [Rating],
    description: 'Ratings that got submitten for the wine',
  })
  @OneToMany(() => Rating, (rating) => rating.wine)
  ratings: Rating[];

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
