import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma';
import { OtpModule } from '../otp';
import { AdminModule } from 'src/admin';

@Module({
  imports: [PrismaModule, OtpModule, AdminModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
