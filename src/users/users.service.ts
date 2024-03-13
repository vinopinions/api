import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService extends CommonService<User> {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private ratingsService: RatingsService,
  ) {
    super(userRepository, User);
  }

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

  async findFriendsPaginated(
    user: User,
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<User>,
  ): Promise<PageDto<User>> {
    return await this.findManyPaginated(paginationOptionsDto, {
      relations: ['friends'],
      ...options,
      where: { ...options?.where, ...{ friends: { id: user.id } } },
    });
  }

  async findRatingsPaginated(
    user: User,
    paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    return await this.ratingsService.findManyByUserPaginated(
      user,
      paginationOptionsDto,
    );
  }

  async remove(id: string): Promise<User> {
    const user: User = await this.findOne({ where: { id } });
    await this.userRepository.remove(user);
    return user;
  }

  /**
   *
   * @param addingUser the user who wants to add the friend
   * @param toBeAddedUser the user who should be added as a friend
   */
  async addFriend(addingUser: User, toBeAddedUser: User) {
    // load relations
    addingUser = await this.findOne({
      where: { id: addingUser.id },
      relations: ['friends'],
    });
    toBeAddedUser = await this.findOne({
      where: { id: toBeAddedUser.id },
      relations: ['friends'],
    });

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
    // load relations
    removingUser = await this.findOne({
      where: {
        id: removingUser.id,
      },
      relations: ['friends'],
    });

    toBeRemovedUser = await this.findOne({
      where: {
        id: toBeRemovedUser.id,
      },
      relations: ['friends'],
    });

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
