import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User, UserRelations } from './entities/user.entity';

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
      throw new ConflictException('This username is already taken');

    const user: User = this.userRepository.create({ username, passwordHash });
    const dbUser: User = await this.userRepository.save(user);
    return await this.findOne({
      where: {
        id: dbUser.id,
      },
    });
  }

  findMany(options?: FindManyOptions<User>) {
    return this.userRepository.find({
      relations: Object.fromEntries(UserRelations.map((key) => [key, true])),
      ...options,
    });
  }

  async findOne(options: FindOneOptions<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      relations: Object.fromEntries(UserRelations.map((key) => [key, true])),
      ...options,
    });
    if (!user)
      throw new NotFoundException(
        `User with ${JSON.stringify(options.where)} not found`,
      );
    return user;
  }

  async remove(id: string): Promise<User> {
    const user: User = await this.findOne({ where: { id } });
    const dbUser: User = await this.userRepository.remove(user);
    return user;
  }

  /**
   *
   * @param addingUser the user who wants to add the friend
   * @param toBeAddedUser the user who should be added as a friend
   */
  async addFriend(addingUser: User, toBeAddedUser: User) {
    if (addingUser.friends.includes(toBeAddedUser))
      throw new NotFoundException('You already friends');

    // add toBeAddedUser to addingUser's friends
    addingUser.friends.push(toBeAddedUser);

    if (toBeAddedUser.friends.includes(addingUser))
      throw new InternalServerErrorException(
        'User was already in one friend list but not the other',
      );

    // add addingUser to toBeAddedUser's friends
    toBeAddedUser.friends.push(addingUser);
    // Save changes to the database
    await this.userRepository.save([addingUser, toBeAddedUser]);
  }

  /**
   *
   * @param removingUser the user who wants to remove the friend
   * @param toBeRemovedUser the user who should be removed as a friend
   */
  async removeFriend(removingUser: User, toBeRemovedUser: User) {
    if (!removingUser.friends.find((user) => user.id == toBeRemovedUser.id))
      throw new NotFoundException('This user is not your friend');

    // remove toBeRemovedUser from removingUser's friends
    removingUser.friends = removingUser.friends.filter(
      (user) => user.id !== toBeRemovedUser.id,
    );

    if (!toBeRemovedUser.friends.find((user) => user.id == removingUser.id))
      throw new InternalServerErrorException(
        'User were not in both of each others friend lists',
      );

    // remove removingUser from toBeRemovedUser's friends
    toBeRemovedUser.friends = toBeRemovedUser.friends.filter(
      (user) => user.id !== removingUser.id,
    );
    // Save changes to the database
    await this.userRepository.save([removingUser, toBeRemovedUser]);
  }
}
