import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, Connection, connect } from 'amqplib';
import { FriendRequest } from '../friend-requests/entities/friend-request.entity';

const SERVICE_NAME = `vp_api.${process.env.NODE_ENV}`;
const LOG_QUEUE = `${SERVICE_NAME}.logs`;
const SEND_FRIEND_REQUEST_QUEUE = `${SERVICE_NAME}.sent_friend_requests`;

@Injectable()
export class RabbitMQService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private connection: Connection;
  private channel: Channel;

  constructor(private configService: ConfigService) {}

  private async connect() {
    try {
      this.connection = await connect(
        this.configService.getOrThrow('RABBITMQ_URL'),
      );
      this.channel = await this.connection.createChannel();
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
  }

  async onApplicationBootstrap() {
    await this.connect();
  }

  async onApplicationShutdown() {
    await this.connection.close();
  }

  async sendMessage(queue: string, message: string): Promise<boolean> {
    await this.channel.assertQueue(queue, { durable: false });
    return this.channel.sendToQueue(queue, Buffer.from(message));
  }

  async sendFriendRequestNotificationMessage(friendRequest: FriendRequest) {
    return await this.sendMessage(
      SEND_FRIEND_REQUEST_QUEUE,
      JSON.stringify({
        sender: {
          id: friendRequest.sender.id,
          username: friendRequest.sender.username,
        },
        receiver: {
          id: friendRequest.receiver.id,
          username: friendRequest.receiver.username,
        },
      }),
    );
  }

  async sendLogMessage(log: string) {
    return await this.sendMessage(LOG_QUEUE, log);
  }
}
