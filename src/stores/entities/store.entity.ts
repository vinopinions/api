import { ApiProperty } from '@nestjs/swagger';
import { Wine } from 'src/wines/entities/wine.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Store {
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
    example: 'Wein&Gut',
    description: 'name of store',
    type: String,
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 'Schreinerstraße 22',
    description: 'address of store',
    type: String,
  })
  @Column()
  address?: string;

  @ApiProperty({
    example: 'https://www.weinundgut-berlin.de/',
    description: 'website of store',
    type: String,
  })
  @Column()
  url?: string;

  @OneToMany(() => Wine, (wine) => wine.store)
  wines: Wine[];
}
