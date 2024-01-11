import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { FriendRequest } from './../friends/entities/friend-request.entity';

@Injectable()
export class FriendRequestsService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
  ) {}

  /**
   * Rules:
   *    1. A user can not send himself a friend request
   *    2. A user can not receive 2 friend requests from the same sender
   *    3. A user can not send a friend request to a user he is already friends with
   *    4. A user can not send a friend request to a user that has sent him a friend request already
   *
   * @param sender user who sends the friend request
   * @param receiver user that should receive the friend request
   */
  async sendFriendRequest(sender: User, receiver: User) {
    // 1. Rule
    if (sender.id == receiver.id)
      throw new ConflictException('You can not send yourself a friend request');

    // 2. Rule
    const receiverReceivedFriendRequests =
      await this.friendRequestRepository.find({
        where: {
          receiver: {
            id: receiver.id,
          },
        },
        relations: {
          sender: true,
        },
      });

    // check if the sender has already sent a request to the receiver
    if (
      receiverReceivedFriendRequests.find(
        (request) => request.sender.id == sender.id,
      )
    )
      throw new ConflictException(
        'You already sent a friend request to that user',
      );

    // 3. Rule
    const receiverFriends = await this.usersService.getFriends(receiver);

    if (receiverFriends.includes(sender))
      throw new ConflictException('You are already friends with that user');

    // 4. Rule
    const receiverSentFriendRequests = await this.friendRequestRepository.find({
      where: {
        sender: {
          id: receiver.id,
        },
      },
      relations: {
        receiver: true,
      },
    });

    // check if the sender has already sent a request to the receiver
    if (
      receiverSentFriendRequests.find(
        (request) => request.receiver.id == sender.id,
      )
    )
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

  /**
   *
   * @param acceptingUser the user who received the friend request
   * @param toAcceptUser the user who should be accepted as a friend
   */
  async acceptFriendRequest(acceptingUser: User, toAcceptUser: User) {
    const friendRequest = await this.friendRequestRepository.findOne({
      where: {
        sender: {
          id: toAcceptUser.id,
        },
        receiver: {
          id: acceptingUser,
        },
      },
    });

    if (!friendRequest)
      throw new NotFoundException(
        'This user did not send you a friend request',
      );

    // remove friend request
    await this.friendRequestRepository.remove(friendRequest);

    // add as friends
    await this.usersService.addFriend(acceptingUser, toAcceptUser);
  }

  /**
   *
   * @param acceptingUser the user who received the friend request
   * @param toAcceptUser the user who should be accepted as a friend
   */
  async declineFriendRequest(decliningUser: User, toDeclineUser: User) {
    //     if (!decliningUser.receivedFriendRequests.includes(toDeclineUser))
    //       throw new NotFoundException(
    //         'This user did not send you a friend request',
    //       );
    //     // Remove friend request from the decliningUser's list of received requests
    //     decliningUser.receivedFriendRequests =
    //       decliningUser.receivedFriendRequests.filter(
    //         (user) => user.id !== toDeclineUser.id,
    //       );
    //     // Remove the decliningUser from the toDeclineUser's list of sent friend requests
    //     toDeclineUser.sentFriendRequests = toDeclineUser.sentFriendRequests.filter(
    //       (user) => user.id !== decliningUser.id,
    //     );
    //     // Save changes to the database
    //     await this.userRepository.save([decliningUser, toDeclineUser]);
  }

  async getReceivedFriendRequests(user: User): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        receiver: user,
      },
    });
  }

  async getSentFriendRequests(user: User): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        sender: user,
      },
    });
  }
}
