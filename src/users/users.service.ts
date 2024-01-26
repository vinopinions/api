import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Rating } from '../ratings/entities/rating.entity';
import { User } from './entities/user.entity';
import { RatingsService } from '../ratings/ratings.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private ratingsService: RatingsService,
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

  findMany(options?: FindManyOptions<User>) {
    return this.userRepository.find(options);
  }

  async findOne(options: FindOneOptions<User>): Promise<User> {
    const user = await this.userRepository.findOne(options);
    if (!user)
      throw new NotFoundException(
        `User with ${JSON.stringify(options.where)} not found`,
      );
    return user;
  }

  async remove(id: string): Promise<User> {
    const user: User = await this.findOne({ where: { id } });
    return this.userRepository.remove(user);
  }

  async getFriends(user: User): Promise<User[]> {
    const userWithRelation = await this.findOne({
      where: { id: user.id },
      relations: {
        friends: true,
      },
    });

    return userWithRelation.friends;
  }

  /**
   *
   * @param addingUser the user who wants to add the friend
   * @param toBeAddedUser the user who should be added as a friend
   */
  async addFriend(addingUser: User, toBeAddedUser: User) {
    const addingUserWithRelation = await this.findOne({
      where: { id: addingUser.id },
      relations: {
        friends: true,
      },
    });
    const toBeAddedUserWithRelation = await this.findOne({
      where: { id: toBeAddedUser.id },
      relations: {
        friends: true,
      },
    });

    if (addingUserWithRelation.friends.includes(toBeAddedUser))
      throw new NotFoundException('You already friends');

    // add toBeAddedUser to addingUser's friends
    addingUserWithRelation.friends.push(toBeAddedUser);

    if (toBeAddedUserWithRelation.friends.includes(addingUser))
      throw new InternalServerErrorException(
        'User was already in one friend list but not the other',
      );

    // add addingUser to toBeAddedUser's friends
    toBeAddedUserWithRelation.friends.push(addingUser);
    // Save changes to the database
    await this.userRepository.save([
      addingUserWithRelation,
      toBeAddedUserWithRelation,
    ]);
  }

  /**
   *
   * @param removingUser the user who wants to remove the friend
   * @param toBeRemovedUser the user who should be removed as a friend
   */
  async removeFriend(removingUser: User, toBeRemovedUser: User) {
    const removingUserWithRelation = await this.findOne({
      where: { id: removingUser.id },
      relations: {
        friends: true,
      },
    });
    const toBeRemovedUserWithRelation = await this.findOne({
      where: {
        id: toBeRemovedUser.id,
      },
      relations: {
        friends: true,
      },
    });

    if (
      !removingUserWithRelation.friends.find(
        (user) => user.id == toBeRemovedUser.id,
      )
    )
      throw new NotFoundException('This user is not your friend');

    // remove toBeRemovedUser from removingUser's friends
    removingUserWithRelation.friends = removingUserWithRelation.friends.filter(
      (user) => user.id !== toBeRemovedUser.id,
    );

    if (
      !toBeRemovedUserWithRelation.friends.find(
        (user) => user.id == removingUser.id,
      )
    )
      throw new InternalServerErrorException(
        'User were not in both of each others friend lists',
      );

    // remove removingUser from toBeRemovedUser's friends
    toBeRemovedUserWithRelation.friends =
      toBeRemovedUserWithRelation.friends.filter(
        (user) => user.id !== removingUser.id,
      );
    // Save changes to the database
    await this.userRepository.save([
      removingUserWithRelation,
      toBeRemovedUserWithRelation,
    ]);
  }
  async getRatings(username: string): Promise<Rating[]> {
    const user: User = await this.findOne({
      where: { username },
    });

    return this.ratingsService.findMany({
      where: { user: { id: user.id } },
      relations: {
        wine: true,
        user: true,
      },
    });
  }
}
