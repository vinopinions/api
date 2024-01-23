import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { FriendRequest } from './entities/friend-request.entity';

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
    const friendRequest = await this.friendRequestRepository.findOne(options);
    if (!friendRequest)
      throw new NotFoundException(
        `FriendRequest with ${JSON.stringify(options.where)} not found`,
      );
    return friendRequest;
  }

  findMany(options?: FindManyOptions<FriendRequest>) {
    return this.friendRequestRepository.find(options);
  }

  /**
   * Rules:
   *    1. A user can not send himself a friend request
   *    2. A user can not receive 2 friend requests from the same sender
   *    3. A user can not send a friend request to a user he is already friends with
   *    4. A user can not send a friend request to a user that has sent him a friend request already
   */
  async sendFriendRequest(sender: User, receiver: User) {
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
    const receiverFriends = await this.usersService.getFriends(receiver);

    if (receiverFriends.includes(sender))
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

    await this.friendRequestRepository.save(friendRequest);
  }

  async acceptFriendRequest(id: string, acceptingUser: User) {
    const friendRequest: FriendRequest = await this.findOne({
      where: {
        id,
        receiver: {
          id: acceptingUser.id,
        },
      },
      relations: {
        sender: true,
        receiver: true,
      },
    });

    // remove friend request
    await this.friendRequestRepository.remove(friendRequest);

    // add as friends
    await this.usersService.addFriend(acceptingUser, friendRequest.sender);
  }

  async declineFriendRequest(id: string, decliningUser: User) {
    const friendRequest: FriendRequest = await this.findOne({
      where: {
        id,
        receiver: {
          id: decliningUser.id,
        },
      },
      relations: {
        receiver: true,
      },
    });

    return await this.friendRequestRepository.remove(friendRequest);
  }

  /**
   *
   * @param acceptingUser the user who sent the friend request
   * @param toAcceptUser the user who's friend request should be revoked
   */
  async revokeFriendRequest(id: string, revokingUser: User) {
    const friendRequest: FriendRequest = await this.findOne({
      where: {
        id,
        sender: {
          id: revokingUser.id,
        },
      },
    });

    await this.friendRequestRepository.remove(friendRequest);
  }

  async getReceivedFriendRequests(user: User): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        receiver: {
          id: user.id,
        },
      },
      relations: {
        sender: true,
        receiver: true,
      },
    });
  }

  async getSentFriendRequests(user: User): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        sender: {
          id: user.id,
        },
      },
      relations: {
        sender: true,
        receiver: true,
      },
    });
  }
}
