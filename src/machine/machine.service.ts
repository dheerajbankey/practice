import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AdminService } from '../admin/admin.service';
import {
  Machine,
  Prisma,
  //Prisma,
} from '@prisma/client';
import { adminConfigFactory } from '@Config';
import { StorageService, UtilsService } from '@Common';
import { PrismaService } from '../prisma';

@Injectable()
export class MachineService {
  constructor(
    @Inject(adminConfigFactory.KEY)
    private readonly config: ConfigType<typeof adminConfigFactory>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly storageService: StorageService,
    private readonly adminService: AdminService,
  ) {}

  async getById(adminId: string): Promise<Machine> {
    return await this.prisma.machine.findUniqueOrThrow({
      where: {
        id: adminId,
      },
    });
  }

  // eslint-disable-next-line prettier/prettier
  async createMachine(
    adminId: string,
    machineNo: string,
    amount: number,
  ): Promise<Machine> {
    const admin = await this.adminService.getById(adminId);
    const balanceToUpdate = admin.balance === null ? 0 : admin.balance;
    const newAdminBalance = balanceToUpdate - amount;

    if (newAdminBalance < 0) {
      throw new Error(`Admin does not have sufficient balance`);
    }
    await this.prisma.admin.update({
      where: {
        id: adminId,
      },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });
    const machine = await this.prisma.machine.count({
      where: {
        machineNo: machineNo,
      },
    });
    if (machine > 0) {
      throw new Error(`Machine already exists`);
    }
    return await this.prisma.machine.create({
      data: {
        machineNo,
        balance: amount,
      },
    });
  }

  async getMachineList(options?: {
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{
    count: number;
    skip: number;
    take: number;
    data: Machine[];
  }> {
    const pagination = { skip: options?.skip || 0, take: options?.take || 10 };
    let where: Prisma.MachineWhereInput = {}; // Correct type here

    if (options?.search) {
      where = {
        machineNo: {
          equals: options.search.trim(),
          mode: 'insensitive',
        },
      };
    }

    const totalMachines = await this.prisma.machine.count({
      where,
    });

    const machines = await this.prisma.machine.findMany({
      where,
      orderBy: { machineNo: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    });

    const response = machines.map((machine) => ({
      ...machine,
    }));

    return {
      count: totalMachines,
      skip: pagination.skip,
      take: pagination.take,
      data: response,
    };
  }

  async addAmount(
    machineId: string,
    amount: number,
    adminId: string,
  ): Promise<Machine> {
    const admin = await this.adminService.getById(adminId);
    const machine = await this.getById(machineId);

    const balanceToUpdate = admin.balance === null ? 0 : admin.balance;
    const newAdminBalance = balanceToUpdate - amount;

    if (newAdminBalance < 0) {
      throw new Error(`Admin does not have sufficient balance`);
    }
    await this.prisma.admin.update({
      where: {
        id: adminId,
      },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    const machinebalance = machine.balance === null ? 0 : machine.balance;
    const updatedUser = await this.prisma.machine.update({
      where: {
        id: machineId,
      },
      data: {
        balance: machinebalance + amount,
      },
    });

    return updatedUser;
  }

  async removeAmount(
    machineId: string,
    amount: number,
    adminId: string,
  ): Promise<Machine> {
    const machine = await this.getById(machineId);
    const admin = await this.adminService.getById(adminId);
    const balanceToUpdate = machine.balance === null ? 0 : machine.balance;
    if (balanceToUpdate == 0 || balanceToUpdate < amount) {
      throw new Error('Insufficient Amount');
    }
    const updatedAmount = await this.prisma.machine.update({
      where: {
        id: machineId,
      },
      data: {
        balance: {
          set: balanceToUpdate - amount,
        },
      },
    });
    await this.prisma.admin.update({
      where: {
        id: admin.id,
      },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
    return updatedAmount;
  }
}
