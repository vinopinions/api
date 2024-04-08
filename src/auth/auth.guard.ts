import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export type AuthenticatedRequest = Request & { user: User };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    let firebaseId: string;
    try {
      const decodedToken = await this.authService.verifyIdToken(token);

      firebaseId = decodedToken.uid;
      console.log({ step: 2, firebaseId });
    } catch (e) {
      throw new UnauthorizedException();
    }
    let user: User;
    try {
      user = await this.usersService.findOne({
        where: { firebaseId },
      });
    } catch (NotFoundException) {
      throw new UnauthorizedException();
    }

    request['user'] = user;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
