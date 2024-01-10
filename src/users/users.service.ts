import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(username: string, passwordHash: string): Promise<User> {
    const existingUser: User | null = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser !== null)
      throw new ConflictException('username already exists');

    const user: User = this.userRepository.create({ username, passwordHash });
    return this.userRepository.save(user);
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOneById(
    id: string,
    relations?: FindOptionsRelations<User>,
  ): Promise<User> {
    const user = await this.findOne({ id }, relations);
    if (!user) throw new NotFoundException(`User with name ${name} not found`);
    return user;
  }

  findOneByUsername(
    username: string,
    relations?: FindOptionsRelations<User>,
  ): Promise<User> {
    return this.findOne({ username }, relations);
  }

  async findOne(
    where: FindOptionsWhere<User>[] | FindOptionsWhere<User>,
    relations?: FindOptionsRelations<User>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where,
      relations,
    });
    if (!user)
      throw new NotFoundException(
        `User with ${JSON.stringify(where)} not found`,
      );
    return user;
  }

  async remove(id: string): Promise<User> {
    const user: User | null = await this.findOneById(id);
    if (user === null) throw new NotFoundException();
    return this.userRepository.remove(user);
  }

  async getFriends(user: User): Promise<User[]> {
    const userWithRelation = await this.findOneById(user.id, {
      friends: true,
    });

    return userWithRelation.friends;
  }
}
