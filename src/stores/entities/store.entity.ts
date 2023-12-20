import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Wine } from '../../wines/entities/wine.entity';

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
    pattern:
      '[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)',
  })
  @Matches(
    /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
    {
      message: 'invalid url',
    },
  )
  @Column()
  url?: string;

  @OneToMany(() => Wine, (wine) => wine.store)
  wines: Wine[];
}
