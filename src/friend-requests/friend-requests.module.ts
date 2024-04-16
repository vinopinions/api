import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { UsersModule } from '../users/users.module';
import { FriendRequest } from './entities/friend-request.entity';
import { FriendRequestsController } from './friend-requests.controller';
import { FriendRequestsService } from './friend-requests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequest]),
    UsersModule,
    RabbitMQModule,
  ],
  providers: [FriendRequestsService],
  exports: [FriendRequestsService],
  controllers: [FriendRequestsController],
})
export class FriendRequestsModule {}
