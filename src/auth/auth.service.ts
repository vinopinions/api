import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    if (!username)
      throw new BadRequestException("'username' has to be defined");
    if (!password)
      throw new BadRequestException("'password' has to be defined");
    const user = await this.usersService.findOneByUsername(username);

    if (!user) throw new UnauthorizedException();

    const correct: boolean = await bcrypt.compare(password, user.passwordHash);
    if (!correct) throw new UnauthorizedException();

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(username: string, password: string) {
    if (!username)
      throw new BadRequestException("'username' has to be defined");
    if (!password)
      throw new BadRequestException("'password' has to be defined");

    if (await this.usersService.findOneByUsername(username))
      throw new ConflictException();
    const hash: string = await bcrypt.hash(password, 12);

    this.usersService.create(username, hash);
  }
}
