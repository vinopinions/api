import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Rating } from '../ratings/entities/rating.entity';

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

  async findOneById(id: string): Promise<User> {
    const user: User | null = await this.userRepository.findOne({
      where: { id },
      relations: ['ratings'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findOneByName(name: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username: name } });
  }

  findOneByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async remove(id: string): Promise<User> {
    const user: User = await this.findOneById(id);
    return this.userRepository.remove(user);
  }

  async getRatings(id: string): Promise<Rating[]> {
    const user: User = await this.findOneById(id);
    return user.ratings;
  }
}
