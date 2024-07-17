import { Cache } from 'cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Game, GameStatus, Prisma } from '@prisma/client';
import { adminConfigFactory } from '@Config';
import { StorageService, UtilsService } from '@Common';
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

  async removeGame(gameId: string): Promise<Game> {
    const game = await this.prisma.game.delete({
      where: {
        id: gameId,
      },
    });
    return game;
  }

  async getGameList(options?: {
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{
    count: number;
    skip: number;
    take: number;
    data: Game[];
  }> {
    const pagination = { skip: options?.skip || 0, take: options?.take || 10 };
    let where: Prisma.GameWhereInput = {};
    if (options?.search) {
      const searchTerms = options.search.trim().split(' ');
      where = {
        OR: searchTerms.map((term) => ({
          gameName: {
            contains: term,
            mode: 'insensitive',
          },
        })),
      };
    }

    const totalGames = await this.prisma.game.count({
      where,
    });

    const games = await this.prisma.game.findMany({
      where,
      orderBy: { gameName: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    });

    const response = games.map((game) => ({
      ...game,
    }));

    return {
      count: totalGames,
      skip: pagination.skip,
      take: pagination.take,
      data: response,
    };
  }
}
