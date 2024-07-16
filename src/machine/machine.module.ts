import { Module } from '@nestjs/common';
import { MachineService } from './machine.service';
import { MachineController } from './machine.controller';
import { PrismaModule } from '../prisma';
import { AdminService } from 'src/admin';

@Module({
  imports: [PrismaModule],
  controllers: [MachineController],
  providers: [MachineService, AdminService],
  exports: [MachineService],
})
export class MachineModule {}
