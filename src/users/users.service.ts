import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  async findOneByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async findOneById(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  create(username: string, passwordHash: string) {
    this.users.push({
      id:
        this.users.length == 0
          ? 1
          : Math.max(...this.users.map((user) => user.id)) + 1,
      username,
      passwordHash,
    });
  }
}
