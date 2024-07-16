//import { join } from 'path';
import { Cache } from 'cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Admin,
  // AdminMeta,
  // AdminStatus,
  Game,
  Machine,
  Prisma,
  //Prisma,
  Room,
  UserType,
  // User,
  // UserStatus,
} from '@prisma/client';
import { adminConfigFactory } from '@Config';
import {
  StorageService,
  UtilsService,
  // ValidatedUser,
  // UserType,
  // getAccessGuardCacheKey,
} from '@Common';
import { PrismaService } from '../prisma';

@Injectable()
export class RoomService {
  constructor(
    @Inject(adminConfigFactory.KEY)
    private readonly config: ConfigType<typeof adminConfigFactory>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly storageService: StorageService,
  ) {}

  async getById(adminId: string): Promise<Admin> {
    return await this.prisma.admin.findUniqueOrThrow({
      where: {
        id: adminId,
      },
    });
  }

  async createRoom(
    roomName: string,
    noOfMachines: number,
    noOfSpins: number,
    minJackpot: number,
    maxJackpot: number,
    minBet: number,
    maxBet: number,
    rtp: number,
    currency: string,
  ): Promise<Room> {
    const room = await this.prisma.room.count({
      where: {
        roomName: roomName,
      },
    });
    if (room > 0) {
      throw new Error(`Room already exists`);
    }
    return await this.prisma.room.create({
      data: {
        roomName,
        noOfMachines,
        noOfSpins,
        minJackpot,
        maxJackpot,
        minBet,
        maxBet,
        rtp,
        currency,
      },
    });
  }

  // async getRoomList(
  //   search?: string,
  //   skip?: number,
  //   take?: number,
  // ): Promise<{ rooms: Room[]; total?: number }> {
  //   if (search) {
  //     const rooms = await this.prisma.room.findMany({
  //       where: {
  //         roomName: {
  //           contains: search,
  //           mode: 'insensitive',
  //         },
  //       },
  //       skip: skip,
  //       take: take,
  //     });

  //     const total = await this.prisma.room.count({
  //       where: {
  //         roomName: {
  //           contains: search,
  //           mode: 'insensitive',
  //         },
  //       },
  //     });
  //     if (!rooms) {
  //       return { rooms: [] };
  //     }
  //     return { rooms, total };
  //   } else {
  //     const total = await this.prisma.room.count();

  //     const rooms = await this.prisma.room.findMany({
  //       skip: skip,
  //       take: take,
  //     });

  //     return { rooms, total };
  //   }
  // }

  async getRoomList(options?: {
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{
    count: number;
    skip: number;
    take: number;
    data: Room[];
  }> {
    const pagination = { skip: options?.skip || 0, take: options?.take || 10 };
    let where: Prisma.RoomWhereInput = {}; // Correct type here

    if (options?.search) {
      where = {
        roomName: {
          equals: options.search.trim(),
          mode: 'insensitive',
        },
      };
    }

    const totalRooms = await this.prisma.room.count({
      where,
    });

    const rooms = await this.prisma.room.findMany({
      where,
      orderBy: { roomName: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    });

    const response = rooms.map((room) => ({
      ...room,
    }));

    return {
      count: totalRooms,
      skip: pagination.skip,
      take: pagination.take,
      data: response,
    };
  }
  async alotManager(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        userType: true,
      },
    });
    if (!room && !user) {
      throw new NotFoundException('Room and Manager not found');
    }
    if (user?.userType !== 'Manager') {
      throw new Error('Usertype is not valid');
    }
    const updatedRoom = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        room: {
          connect: { id: userId },
        },
      },
    });

    return updatedRoom;
  }

  async addMachine(roomId: string, machineId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        roomName: true,
      },
    });
    const machineID = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });
    if (!room && !machineID) {
      throw new NotFoundException('Room and Machine not found');
    }
    const updatedRoom = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        machine: {
          connect: { id: machineId },
        },
      },
    });

    await this.prisma.machine.update({
      where: { id: machineId },
      data: {
        roomName: room?.roomName,
      },
    });

    return updatedRoom;
  }

  async addGame(machineId: string, gameId: string, roomName?: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id: machineId },
      select: {
        rooomId: true,
      },
    });
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });
    if (!machine && !game) {
      throw new NotFoundException('Machine and Game not found');
    }
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        roomName: roomName,
      },
    });
    const updatedMachine = await this.prisma.machine.update({
      where: { id: machineId },
      data: {
        games: {
          connect: { id: gameId },
        },
      },
    });

    return updatedMachine;
  }
  async addWorker(machineId: string, userId: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        userType: true,
      },
    });
    if (!machine && !user) {
      throw new NotFoundException('Machine and User not found');
    }
    if (user?.userType !== UserType.Worker) {
      throw new Error('UserType is not valid');
    }
    const updatedMachine = await this.prisma.machine.update({
      where: { id: machineId },
      data: {
        user: {
          connect: { id: userId },
        },
      },
    });

    return updatedMachine;
  }

  async getRoomMachines(
    roomId?: string,
    search?: string,
    skip?: number,
    take?: number,
  ): Promise<{
    machines: Machine[];
    total?: number;
    skip?: number;
    take?: number;
  }> {
    if (search) {
      const machines = await this.prisma.machine.findMany({
        where: {
          machineNo: {
            contains: search,
            mode: 'insensitive',
          },
        },
        skip: skip,
        take: take,
      });
      const totals = await this.prisma.machine.count({
        where: {
          rooomId: roomId,
          machineNo: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });
      return { machines, total: totals };
    }
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const machines = await this.prisma.machine.findMany({
      where: { rooomId: roomId },
      skip: skip,
      take: take,
    });

    return { machines, total: machines.length, skip, take };
  }

  async getMachinesGames(
    machineId?: string,
    search?: string,
    skip?: number,
    take?: number,
  ): Promise<{ games: Game[]; total?: number; skip?: number; take?: number }> {
    if (search) {
      const games = await this.prisma.game.findMany({
        where: {
          gameName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        skip: skip,
        take: take,
      });

      const totals = await this.prisma.game.count({
        where: {
          machineId: machineId,
          gameName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });
      return { games, total: totals };
    }
    const room = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });

    if (!room) {
      throw new NotFoundException('Machine not found');
    }

    const games = await this.prisma.game.findMany({
      where: { machineId: machineId },
      skip: skip,
      take: take,
    });
    return { games, total: games.length, skip, take };
  }
}
