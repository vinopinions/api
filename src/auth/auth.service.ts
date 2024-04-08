import { ConflictException, Injectable } from '@nestjs/common';
import admin from 'firebase-admin';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async verifyIdToken(idToken: string) {
    return await admin.auth().verifyIdToken(idToken);
  }

  async signUp(username: string, firebaseToken: string): Promise<User> {
    // Weird setup but since findOneByUsername throws an exception when no user is found it makes sense
    try {
      if (await this.usersService.findOne({ where: { username } }))
        throw new ConflictException('This username is already taken');
    } catch (NotFoundException) {
      // username is not taken yet
      const decodedToken = await this.verifyIdToken(firebaseToken);

      return await this.usersService.create(username, decodedToken.uid);
    }
    throw new ConflictException();
  }

  /**
   * Check if a firebase user is already registered on the backend
   */
  async check(firebaseToken: string): Promise<boolean> {
    const decodedToken = await this.verifyIdToken(firebaseToken);

    try {
      // Check if the user exists in your backend system
      const user = await this.usersService.findOne({
        where: {
          firebaseId: decodedToken.uid,
        },
      });

      return user != null;
    } catch (NotFoundException) {
      return false;
    }
  }
}
