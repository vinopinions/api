import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { SignInResponseDto } from './dtos/sign-in-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string): Promise<SignInResponseDto> {
    if (!username)
      throw new BadRequestException("'username' has to be defined");
    if (!password)
      throw new BadRequestException("'password' has to be defined");
    const user = await this.usersService.findOne({ where: { username } });

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

    // Weird setup but since findOneByUsername throws an exception when no user is found it makes sense
    try {
      if (await this.usersService.findOne({ where: { username } }))
        throw new ConflictException();
    } catch (NotFoundException) {
      const hash: string = await bcrypt.hash(password, 12);

      this.usersService.create(username, hash);
    }
  }
}
