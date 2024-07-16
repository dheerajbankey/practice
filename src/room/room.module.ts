import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { AdminController } from './room.controller';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
