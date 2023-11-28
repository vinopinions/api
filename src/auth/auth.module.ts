import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        publicKey: configService.get('JWT_PUBLIC_KEY'),
        privateKey: configService.get('JWT_PRIVATE_KEY'),
        verifyOptions: {
          issuer: configService.get('AUTH_SERVICE_DOMAIN'),
          algorithms: ['RS256'],
        },
        signOptions: {
          expiresIn: '1h',
          issuer: configService.get('AUTH_SERVICE_DOMAIN'),
          algorithm: 'RS256',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    AuthService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
