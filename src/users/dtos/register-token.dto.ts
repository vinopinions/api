import { IsUUID } from 'class-validator';
import Token from '../models/token';

export class RegisterTokenDto extends Token {
  @IsUUID()
  userId: string;
}
