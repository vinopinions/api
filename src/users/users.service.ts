import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  findOneByName(name: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username: name } });
  }

  findOneByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async remove(id: string): Promise<User> {
    const user: User | null = await this.findOneById(id);
    if (user === null) throw new NotFoundException();
    return this.userRepository.remove(user);
  }

  async sendFriendRequest(sender: User, receiver: User) {
    if (receiver.receivedFriendRequests.includes(sender))
      throw new ConflictException(
        'The user already sent a friend request to that user',
      );

    sender.sentFriendRequests.push(receiver);
    receiver.receivedFriendRequests.push(sender);
    this.userRepository.save([sender, receiver]);
  }

  /**
   *
   * @param acceptingUser the user who received the friend request
   * @param toAcceptUser the user who should be accepted as a friend
   */
  async acceptFriendRequest(acceptingUser: User, toAcceptUser: User) {
    if (!acceptingUser.receivedFriendRequests.includes(toAcceptUser))
      throw new NotFoundException(
        'This user did not send you a friend request',
      );

    // Remove friend request from the acceptingUser's list of received requests
    acceptingUser.receivedFriendRequests =
      acceptingUser.receivedFriendRequests.filter(
        (user) => user.id !== toAcceptUser.id,
      );

    // Remove the acceptingUser from the toAcceptUser's list of sent friend requests
    toAcceptUser.sentFriendRequests = toAcceptUser.sentFriendRequests.filter(
      (user) => user.id !== acceptingUser.id,
    );

    // Add the sender to the receiver's list of friends
    acceptingUser.friends = [...acceptingUser.friends, toAcceptUser];

    // Add the receiver to the sender's list of friends
    toAcceptUser.friends = [...toAcceptUser.friends, acceptingUser];

    // Save changes to the database
    await this.userRepository.save([acceptingUser, toAcceptUser]);
  }

  /**
   *
   * @param acceptingUser the user who received the friend request
   * @param toAcceptUser the user who should be accepted as a friend
   */
  async declineFriendRequest(decliningUser: User, toDeclineUser: User) {
    if (!decliningUser.receivedFriendRequests.includes(toDeclineUser))
      throw new NotFoundException(
        'This user did not send you a friend request',
      );

    // Remove friend request from the decliningUser's list of received requests
    decliningUser.receivedFriendRequests =
      decliningUser.receivedFriendRequests.filter(
        (user) => user.id !== toDeclineUser.id,
      );

    // Remove the decliningUser from the toDeclineUser's list of sent friend requests
    toDeclineUser.sentFriendRequests = toDeclineUser.sentFriendRequests.filter(
      (user) => user.id !== decliningUser.id,
    );

    // Save changes to the database
    await this.userRepository.save([decliningUser, toDeclineUser]);
  }

  /**
   *
   * @param acceptingUser the user who received the friend request
   * @param toAcceptUser the user who should be accepted as a friend
   */
  async removeFriend(removingUser: User, toRemoveUser: User) {
    if (!removingUser.friends.includes(toRemoveUser))
      throw new NotFoundException('This user is not your friend');

    // remove toRemoveUser from removingUser's friends
    removingUser.friends = removingUser.friends.filter(
      (user) => user.id !== toRemoveUser.id,
    );

    // remove removingUser from toRemoveUser's friends
    toRemoveUser.friends = toRemoveUser.friends.filter(
      (user) => user.id !== removingUser.id,
    );

    // Save changes to the database
    await this.userRepository.save([removingUser, toRemoveUser]);
  }

  async getReceivedFriendRequests(user: User): Promise<User[]> {
    return user.receivedFriendRequests;
  }

  async getSentFriendRequests(user: User): Promise<User[]> {
    return user.sentFriendRequests;
  }
}
