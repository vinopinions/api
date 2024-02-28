import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wine, WineWithoutRelations } from '../../wines/entities/wine.entity';

@Entity()
export class Store {
  @ApiProperty({
    description: 'uuid',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Wein&Gut',
    description: 'name of store',
    type: String,
  })
  @IsString()
  @Column()
  name: string;

  @ApiProperty({
    example: 'Schreinerstraße 22',
    description: 'address of store',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  address?: string;

  @ApiProperty({
    example: 'https://www.weinundgut-berlin.de/',
    description: 'website of store',
    type: String,
    pattern:
      '[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)',
  })
  @IsOptional()
  @IsUrl()
  @Column({ nullable: true })
  url?: string;

  @ApiProperty({
    description: 'List of wines that the store sells',
    type: WineWithoutRelations,
    isArray: true,
  })
  @ManyToMany(() => Wine, (wine) => wine.stores)
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

export const StoreRelations: (keyof Store)[] = ['wines'];

export class StoreWithoutRelation extends OmitType(Store, StoreRelations) {}
