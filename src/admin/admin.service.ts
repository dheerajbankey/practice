import { join } from 'path';
import { Cache } from 'cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Admin,
  AdminMeta,
  AdminStatus,
  Game,
  Machine,
  //Prisma,
  Room,
  User,
} from '@prisma/client';
import { adminConfigFactory } from '@Config';
import {
  StorageService,
  UtilsService,
  ValidatedUser,
  UserType,
  getAccessGuardCacheKey,
} from '@Common';
import { PrismaService } from '../prisma';

@Injectable()
export class AdminService {
  constructor(
    @Inject(adminConfigFactory.KEY)
    private readonly config: ConfigType<typeof adminConfigFactory>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly storageService: StorageService,
  ) {}

  getProfileImageUrl(profileImage: string): string {
    return this.storageService.getFileUrl(
      profileImage,
      this.config.profileImagePath,
    );
  }

  private hashPassword(password: string): { salt: string; hash: string } {
    const salt = this.utilsService.generateSalt(this.config.passwordSaltLength);
    const hash = this.utilsService.hashPassword(
      password,
      salt,
      this.config.passwordHashLength,
    );
    return { salt, hash };
  }
  async isUsernameExist(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    return (
      (await this.prisma.user.count({
        where: {
          username,
          NOT: {
            id: excludeUserId,
          },
        },
      })) !== 0
    );
  }

  async isEmailExist(email: string, excludeAdminId?: string): Promise<boolean> {
    return (
      (await this.prisma.admin.count({
        where: {
          email: email.toLowerCase(),
          NOT: {
            id: excludeAdminId,
          },
        },
      })) !== 0
    );
  }

  async getById(adminId: string): Promise<Admin> {
    return await this.prisma.admin.findUniqueOrThrow({
      where: {
        id: adminId,
      },
    });
  }

  async getByEmail(email: string): Promise<Admin | null> {
    return await this.prisma.admin.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  async getMetaById(adminId: string): Promise<AdminMeta> {
    return await this.prisma.adminMeta.findUniqueOrThrow({
      where: {
        adminId,
      },
    });
  }

  async authenticate(adminId: string, password: string): Promise<Admin> {
    const admin = await this.getById(adminId);
    const validation = await this.validateCredentials(admin.email, password);

    if (!validation === null) throw new Error('Admin not found');
    if (validation === false) throw new Error('Incorrect password');

    return admin;
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<ValidatedUser | false | null> {
    const admin = await this.getByEmail(email);
    if (!admin) return null;
    if (admin.status !== AdminStatus.Active) {
      throw new Error(
        'Your account has been temporarily suspended/blocked by the system',
      );
    }

    const adminMeta = await this.getMetaById(admin.id);
    const passwordHash = this.utilsService.hashPassword(
      password,
      adminMeta.passwordSalt || '',
      adminMeta.passwordHash
        ? adminMeta.passwordHash.length / 2
        : this.config.passwordHashLength,
    );

    if (adminMeta.passwordHash === passwordHash) {
      return {
        id: admin.id,
        type: UserType.Admin,
      };
    }

    return false;
  }

  async getProfile(adminId: string): Promise<Admin> {
    const admin = await this.getById(adminId);
    if (admin.profileImage) {
      admin.profileImage = this.getProfileImageUrl(admin.profileImage);
    }
    return admin;
  }

  async updateProfileDetails(
    adminId: string,
    firstname?: string,
    lastname?: string,
    email?: string,
  ): Promise<Admin> {
    if (email && (await this.isEmailExist(email, adminId)))
      throw new Error('Email already exist');

    return await this.prisma.admin.update({
      data: {
        firstname,
        lastname,
        email: email && email.toLowerCase(),
      },
      where: {
        id: adminId,
      },
    });
  }

  async updateProfileImage(
    adminId: string,
    profileImage: string,
  ): Promise<{ profileImage: string | null }> {
    const admin = await this.getById(adminId);

    return await this.prisma.$transaction(async (tx) => {
      await tx.admin.update({
        where: { id: adminId },
        data: { profileImage },
      });

      // Remove previous profile image from storage
      if (admin.profileImage) {
        await this.storageService.removeFile(
          join(this.config.profileImagePath, admin.profileImage),
        );
      }
      await this.storageService.move(
        profileImage,
        this.config.profileImagePath,
      );

      return {
        profileImage: this.getProfileImageUrl(profileImage),
      };
    });
  }

  async changePassword(
    adminId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<Admin> {
    const admin = await this.getById(adminId);
    const adminMeta = await this.getMetaById(admin.id);

    const hashedPassword = this.utilsService.hashPassword(
      oldPassword,
      adminMeta.passwordSalt || '',
      adminMeta.passwordHash
        ? adminMeta.passwordHash.length / 2
        : this.config.passwordHashLength,
    );

    if (hashedPassword !== adminMeta.passwordHash)
      throw new Error('Password does not match');

    const { salt, hash } = this.hashPassword(newPassword);
    const passwordSalt = salt;
    const passwordHash = hash;

    await this.prisma.adminMeta.update({
      data: {
        passwordHash,
        passwordSalt,
      },
      where: {
        adminId,
      },
    });
    return admin;
  }

  async setStatus(userId: string, status: AdminStatus): Promise<Admin> {
    await this.cacheManager.del(
      getAccessGuardCacheKey({ id: userId, type: UserType.Admin }),
    );
    return await this.prisma.admin.update({
      data: { status },
      where: {
        id: userId,
      },
    });
  }
  async createSubUser(
    firstname: string,
    lastname: string,
    username: string,
    password: string,
    usertype: string,
    currency: string,
  ) {
    if (await this.isUsernameExist(username)) {
      throw new Error('Username already exist');
    }
    const validUserTypes = ['MANAGER', 'WORKER'];
    console.log('usertype', username, usertype);

    if (!validUserTypes.includes(usertype)) {
      throw new Error('UserType is not valid');
    }

    let passwordSalt = null;
    let passwordHash = null;
    if (password) {
      const { salt, hash } = this.hashPassword(password);
      passwordSalt = salt;
      passwordHash = hash;
    }

    return await this.prisma.user.create({
      data: {
        firstname: firstname,
        lastname: lastname,
        email: username,
        usertype: usertype,
        currency: currency,

        meta: {
          create: {
            passwordHash,
            passwordSalt,
          },
        },
      },
    });
  }

  async getUserByType(
    usertype: string,
    search: string,
    skip: number,
    take: number,
  ): Promise<{ users: User[]; total?: number }> {
    if (search) {
      const users = await this.prisma.user.findMany({
        where: {
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });
      const total = await this.prisma.user.count({
        where: {
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });

      if (!users) {
        return { users: [] };
      }

      return { users, total };
    } else {
      const total = await this.prisma.user.count({
        where: { usertype },
      });

      const users = await this.prisma.user.findMany({
        where: { usertype },
        skip: skip,
        take: take,
      });

      return { users, total };
    }
  }
  // async addAmount(
  //   userId: string,
  //   amount: number,
  //   adminId: string,
  // ): Promise<User> {
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       id: userId,
  //     },
  //   });

  //   if (!user) {
  //     throw new Error(`User not found`);
  //   }
  //   const admin = await this.prisma.admin.findUnique({
  //     where: {
  //       id: adminId,
  //     },
  //   });
  //   const balanceToUpdate = admin.balance === null ? 0 : admin.balance;
  //   if (amount < balanceToUpdate) {
  //     await this.prisma.admin.update({
  //       where: {
  //         id: adminId,
  //       },
  //       data: {
  //         balance: {
  //           decrement: amount,
  //         },
  //       },
  //     });
  //     const updatedAmount = await this.prisma.user.update({
  //       where: {
  //         id: userId,
  //       },
  //       data: {
  //         balance: {
  //           set: balanceToUpdate + amount,
  //         },
  //       },
  //     });
  //     return updatedAmount;
  //   }
  // }
  async addAmount(
    userId: string,
    amount: number,
    adminId: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    const admin = await this.prisma.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

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

    const userbalance = user.balance === null ? 0 : user.balance;
    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        balance: userbalance + amount,
      },
    });

    return updatedUser;
  }

  async removeAmount(
    userId: string,
    amount: number,
    adminId: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error(`User not found`);
    }
    const balanceToUpdate = user.balance === null ? 0 : user.balance;
    if (balanceToUpdate == 0 || balanceToUpdate < amount) {
      throw new Error('Insufficient Amount');
    }
    const updatedAmount = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        balance: {
          set: balanceToUpdate - amount,
        },
      },
    });
    await this.prisma.admin.update({
      where: {
        id: adminId,
      },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
    return updatedAmount;
  }

  async updateStatus(userId: string, status: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error(`User not found`);
    }

    if (status === 'Block') {
      if (user.status === 'Active') {
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            status: 'Blocked',
          },
        });
        return true;
      } else {
        return false;
      }
    } else if (status === 'UnBlock') {
      if (user.status === 'Blocked') {
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            status: 'Active',
          },
        });
        return true;
      } else {
        return false;
      }
    } else {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  async updateGameStatus(gameId: string, status: string): Promise<Game> {
    const game = await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return await this.prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        status: status,
      },
    });
  }
  async unfreeze(
    id: string,
    status: string,
    machineNo?: string,
    roomName?: string,
  ): Promise<Machine | Room> {
    if (roomName) {
      const room = await this.prisma.room.findUnique({
        where: {
          id: id,
        },
      });
      if (!room) {
        throw new NotFoundException('Room not found');
      } else {
        return await this.prisma.room.update({
          where: { id: id, roomName: roomName },
          data: { status: status },
        });
      }
    } else {
      const machine = await this.prisma.machine.findUnique({
        where: {
          id: id,
        },
      });
      if (!machine) {
        throw new NotFoundException('Machine not found');
      } else {
        return await this.prisma.machine.update({
          where: { id: id, machineNo: machineNo },
          data: { status: status },
        });
      }
    }
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

  // async createMachine(
  //   machineNo: string,
  //   balance: number,
  //   roomName: string,
  //   roomId?: string,
  // ): Promise<Machine> {
  //   let data: Prisma.MachineCreateInput = {
  //     machineNo,
  //     balance,
  //     roomName,
  //   };

  //   if (roomId) {
  //     const room = await this.prisma.room.findUnique({
  //       where: {
  //         id: roomId,
  //       },
  //     });
  //     if (!room) {
  //       throw new NotFoundException('Room not found');
  //     }

  //     data = {
  //       ...data,
  //       room: {
  //         connect: {
  //           id: roomId,
  //         },
  //       },
  //     };
  //   }

  //   const result = await this.prisma.machine.create({
  //     data,
  //   });

  //   return result;
  // }

  // eslint-disable-next-line prettier/prettier
  async createMachine(machineNo: string, balance: number): Promise<Machine> {
    return await this.prisma.machine.create({
      data: {
        machineNo,
        balance,
      },
    });
  }

  async createGame(gameName: string, currency: string): Promise<Game> {
    return await this.prisma.game.create({
      data: {
        gameName,
        currency,
      },
    });
  }
  async getMasterList(
    userType?: string,
    search?: string,
    skip?: number,
    take?: number,
  ): Promise<{
    users: {
      firstname: string;
      lastname: string;
      credit: number | null;
      status: string;
    }[];
    total?: number;
  }> {
    if (userType !== 'MANAGER') {
      throw new Error('UserType is not valid');
    }
    if (search && userType == 'MANAGER') {
      const users = await this.prisma.user.findMany({
        where: {
          usertype: 'MANAGER',
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          credit: true,
          status: true,
          usertype: true,
        },
      });

      const total = await this.prisma.user.count({
        where: {
          usertype: 'MANAGER',
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });
      return { users, total };
    } else {
      const total = await this.prisma.user.count({
        where: { usertype: userType },
      });

      const users = await this.prisma.user.findMany({
        where: { usertype: userType },
        skip: skip,
        take: take,
        select: {
          id: true,
          firstname: true,
          lastname: true,
          credit: true,
          status: true,
          usertype: true,
        },
      });

      return { users, total };
    }
  }

  async getWorkerList(
    userType?: string,
    search?: string,
    skip?: number,
    take?: number,
  ): Promise<{
    users: {
      firstname: string;
      lastname: string;
      credit: number | null;
      status: string;
    }[];
    total?: number;
  }> {
    if (userType !== 'WORKER') {
      throw new Error('UserType is not valid');
    }
    if (search && userType == 'WORKER') {
      const users = await this.prisma.user.findMany({
        where: {
          usertype: 'WORKER',
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          credit: true,
          status: true,
          usertype: true,
        },
      });

      const total = await this.prisma.user.count({
        where: {
          usertype: 'WORKER',
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });
      return { users, total };
    } else {
      const total = await this.prisma.user.count({
        where: { usertype: userType },
      });

      const users = await this.prisma.user.findMany({
        where: { usertype: userType },
        skip: skip,
        take: take,
        select: {
          id: true,
          firstname: true,
          lastname: true,
          credit: true,
          status: true,
          usertype: true,
        },
      });

      return { users, total };
    }
  }
  async getRoomList(
    search?: string,
    skip?: number,
    take?: number,
  ): Promise<{ rooms: Room[]; total?: number }> {
    if (search) {
      const rooms = await this.prisma.room.findMany({
        where: {
          roomName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        skip: skip,
        take: take,
      });

      const total = await this.prisma.room.count({
        where: {
          roomName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });
      if (!rooms) {
        return { rooms: [] };
      }
      return { rooms, total };
    } else {
      const total = await this.prisma.room.count();

      const rooms = await this.prisma.room.findMany({
        skip: skip,
        take: take,
      });

      return { rooms, total };
    }
  }
  async getMachineList(
    search?: string,
    skip?: number,
    take?: number,
  ): Promise<{ machines: Machine[]; total?: number }> {
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

      const total = await this.prisma.machine.count({
        where: {
          machineNo: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });
      if (!machines) {
        return { machines: [] };
      }
      return { machines, total };
    } else {
      const total = await this.prisma.machine.count();

      const machines = await this.prisma.machine.findMany({
        skip: skip,
        take: take,
      });

      return { machines, total };
    }
  }

  async alotManager(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        usertype: true,
      },
    });
    if (!room && !user) {
      throw new NotFoundException('Room and Manager not found');
    }
    if (user?.usertype !== 'MANAGER') {
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

  async addGame(machineId: string, gameId: string, roomName: string) {
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
        usertype: true,
      },
    });
    if (!machine && !user) {
      throw new NotFoundException('Machine and User not found');
    }
    if (user?.usertype !== 'WORKER') {
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

  async addGameBetAmount(
    gameId: string,
    min: number,
    max: number,
  ): Promise<Game> {
    console.log('THis is gameid,min,max', gameId, min, max);
    const game = await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const result = await this.prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        minBet: min,
        maxBet: max,
      },
    });
    return result;
  }
  async getRoomMachines(
    roomId: string,
  ): Promise<{ machines: Machine[]; total?: number }> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const machines = await this.prisma.machine.findMany({
      where: { rooomId: roomId },
    });

    return { machines, total: machines.length };
  }

  async getMachinesGames(
    machineId: string,
  ): Promise<{ games: Game[]; total?: number }> {
    const room = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });

    if (!room) {
      throw new NotFoundException('Machine not found');
    }

    const games = await this.prisma.game.findMany({
      where: { machineId: machineId },
    });

    return { games, total: games.length };
  }
}
