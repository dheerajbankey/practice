//import { join } from 'path';
import { Cache } from 'cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  //   Admin,
  //   AdminMeta,
  //   AdminStatus,
  Game,
  GameStatus,
  // Machine,
  //Prisma,
  //   Room,
  //   User,
  //   UserStatus,
} from '@prisma/client';
import { adminConfigFactory } from '@Config';
import {
  StorageService,
  UtilsService,
  //   ValidatedUser,
  //   UserType,
  //   getAccessGuardCacheKey,
} from '@Common';
import { PrismaService } from '../prisma';

@Injectable()
export class GameService {
  constructor(
    @Inject(adminConfigFactory.KEY)
    private readonly config: ConfigType<typeof adminConfigFactory>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly storageService: StorageService,
  ) {}

  async updateGameStatus(gameId: string, status: GameStatus): Promise<Game> {
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

  async createGame(gameName: string, currency: string): Promise<Game> {
    const existingGame = await this.prisma.game.count({
      where: { gameName: gameName },
    });
    if (existingGame > 0) {
      throw new Error(`Game already exists`);
    }
    return await this.prisma.game.create({
      data: {
        gameName,
        currency,
      },
    });
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
}
