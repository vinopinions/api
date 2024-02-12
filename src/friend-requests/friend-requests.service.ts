import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  FriendRequest,
  FriendRequestRelations,
} from './entities/friend-request.entity';

@Injectable()
export class FriendRequestsService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
  ) {}

  async findOne(
    options: FindOneOptions<FriendRequest>,
  ): Promise<FriendRequest> {
    const friendRequest = await this.friendRequestRepository.findOne({
      relations: Object.fromEntries(
        FriendRequestRelations.map((key) => [key, true]),
      ),
      ...options,
    });
    if (!friendRequest)
      throw new NotFoundException(
        `FriendRequest with ${JSON.stringify(options.where)} not found`,
      );
    return friendRequest;
  }

  findMany(options?: FindManyOptions<FriendRequest>) {
    return this.friendRequestRepository.find({
      relations: Object.fromEntries(
        FriendRequestRelations.map((key) => [key, true]),
      ),
      ...options,
    });
  }

  /**
   * Rules:
   *    1. A user can not send himself a friend request
   *    2. A user can not receive 2 friend requests from the same sender
   *    3. A user can not send a friend request to a user he is already friends with
   *    4. A user can not send a friend request to a user that has sent him a friend request already
   */
  async send(sender: User, receiver: User): Promise<FriendRequest> {
    // 1. Rule
    if (sender.id == receiver.id)
      throw new ConflictException('You can not send yourself a friend request');

    // 2. Rule
    const possibleAlreadyExistingFriendRequest =
      await this.friendRequestRepository.findOne({
        where: {
          receiver: {
            id: receiver.id,
          },
          sender: {
            id: sender.id,
          },
        },
      });

    // check if the sender has already sent a request to the receiver
    if (possibleAlreadyExistingFriendRequest)
      throw new ConflictException(
        'You already sent a friend request to that user',
      );

    // 3. Rule
    if (receiver.friends.includes(sender))
      throw new ConflictException('You are already friends with that user');

    // 4. Rule
    const possibleAlreadyExistingFriendRequest2 =
      await this.friendRequestRepository.findOne({
        where: {
          sender: {
            id: receiver.id,
          },
          receiver: {
            id: sender.id,
          },
        },
      });

    // check if the sender has already sent a request to the receiver
    if (possibleAlreadyExistingFriendRequest2)
      throw new ConflictException(
        'The user already sent a friend request to you. Accept that.',
      );

    // Add friend request
    const friendRequest = this.friendRequestRepository.create({
      sender,
      receiver,
    });

    const dbFriendRequest =
      await this.friendRequestRepository.save(friendRequest);
    return await this.findOne({
      where: {
        id: dbFriendRequest.id,
      },
    });
  }

  async accept(id: string, acceptingUser: User) {
    const friendRequest: FriendRequest = await this.findOne({
      where: {
        id,
      },
    });

    if (friendRequest.receiver.id !== acceptingUser.id)
      throw new ForbiddenException(
        'You can not accept another users friend request',
      );

    // remove friend request
    await this.friendRequestRepository.remove(friendRequest);

    // add as friends
    await this.usersService.addFriend(acceptingUser, friendRequest.sender);

    return friendRequest;
  }

  async decline(id: string, decliningUser: User) {
    const friendRequest: FriendRequest = await this.findOne({
      where: {
        id,
      },
    });

    if (friendRequest.receiver.id !== decliningUser.id)
      throw new ForbiddenException(
        'You can not decline another users friend request',
      );
    await this.friendRequestRepository.remove(friendRequest);
    return friendRequest;
  }

  /**
   *
   * @param acceptingUser the user who sent the friend request
   * @param toAcceptUser the user who's friend request should be revoked
   */
  async revoke(id: string, revokingUser: User): Promise<FriendRequest> {
    const friendRequest: FriendRequest = await this.findOne({
      where: {
        id,
      },
    });

    if (friendRequest.sender.id !== revokingUser.id)
      throw new ForbiddenException(
        'You can not revoke another users friend request',
      );

    await this.friendRequestRepository.remove(friendRequest);
    return friendRequest;
  }

  async getReceived(user: User): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        receiver: {
          id: user.id,
        },
      },
    });
  }

  async getSent(user: User): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        sender: {
          id: user.id,
        },
      },
    });
  }
}
