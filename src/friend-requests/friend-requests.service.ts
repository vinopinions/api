import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  /**
   * Rules:
   *    1. A user can not receive 2 friend requests from the same sender
   *    2. A user can not send a friend request to a user he is already friends with
   *    3. A user can not send a friend request to a user that has sent him a friend request already
   *
   * @param sender user who sends the friend request
   * @param receiver user that should receive the friend request
   */
  async sendFriendRequest(sender: User, receiver: User) {
    // 1. Rule
    const receiverFriendRequests = await this.friendRequestRepository.find({
      where: {
        receiver,
      },
    });

    console.log(receiverFriendRequests);

    //     if (
    //       receiverWithRelation.receivedFriendRequests.find(
    //         (user) => user.id == sender.id,
    //       )
    //     )
    //       throw new ConflictException(
    //         'The user already sent a friend request to that user',
    //       );

    //     if (receiverWithRelation.friends.find((user) => user.id == sender.id))
    //       throw new ConflictException('The user is already friends with that user');

    //     const senderWithRelation = await this.findOneById(sender.id, {
    //       sentFriendRequests: true,
    //     });

    //     senderWithRelation.sentFriendRequests.push(receiver);
    //     receiverWithRelation.receivedFriendRequests.push(sender);
    //     this.userRepository.save([senderWithRelation, receiverWithRelation]);
  }

  /**
   *
   * @param acceptingUser the user who received the friend request
   * @param toAcceptUser the user who should be accepted as a friend
   */
  async acceptFriendRequest(acceptingUser: User, toAcceptUser: User) {
    //     if (!acceptingUser.receivedFriendRequests.includes(toAcceptUser))
    //       throw new NotFoundException(
    //         'This user did not send you a friend request',
    //       );
    //     // Remove friend request from the acceptingUser's list of received requests
    //     acceptingUser.receivedFriendRequests =
    //       acceptingUser.receivedFriendRequests.filter(
    //         (user) => user.id !== toAcceptUser.id,
    //       );
    //     // Remove the acceptingUser from the toAcceptUser's list of sent friend requests
    //     toAcceptUser.sentFriendRequests = toAcceptUser.sentFriendRequests.filter(
    //       (user) => user.id !== acceptingUser.id,
    //     );
    //     // Add the sender to the receiver's list of friends
    //     acceptingUser.friends = [...acceptingUser.friends, toAcceptUser];
    //     // Add the receiver to the sender's list of friends
    //     toAcceptUser.friends = [...toAcceptUser.friends, acceptingUser];
    //     // Save changes to the database
    //     await this.userRepository.save([acceptingUser, toAcceptUser]);
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

  /**
   *
   * @param acceptingUser the user who received the friend request
   * @param toAcceptUser the user who should be accepted as a friend
   */
  async removeFriend(removingUser: User, toRemoveUser: User) {
    // if (!removingUser.friends.includes(toRemoveUser))
    //   throw new NotFoundException('This user is not your friend');
    // // remove toRemoveUser from removingUser's friends
    // removingUser.friends = removingUser.friends.filter(
    //   (user) => user.id !== toRemoveUser.id,
    // );
    // // remove removingUser from toRemoveUser's friends
    // toRemoveUser.friends = toRemoveUser.friends.filter(
    //   (user) => user.id !== removingUser.id,
    // );
    // // Save changes to the database
    // await this.userRepository.save([removingUser, toRemoveUser]);
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
