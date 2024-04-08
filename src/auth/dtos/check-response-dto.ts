import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CheckResponseDto {
  @ApiProperty({
    description: 'Indicates whether the user exists in the backend system.',
    example: true,
  })
  @IsBoolean()
  exists: boolean;
}
