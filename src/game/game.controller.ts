import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AccessGuard,
  BaseController,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';
import { GameService } from './game.service';
import {
  createGameDto,
  updateGameStatusDto,
  addMinMaxGameBetDto,
  deleteGameDto,
} from './dto';
import { getGameListDto } from './dto/get-gamelist.dto';

@ApiTags('Game')
@ApiBearerAuth()
@Roles(UserType.Admin)
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@Controller('game')
export class GameController extends BaseController {
  constructor(private readonly gameService: GameService) {
    super();
  }

  @Patch('update-game-status')
  async updateGameStatus(@Body() data: updateGameStatusDto) {
    await this.gameService.updateGameStatus(data.gameId, data.status);
    return { status: 'success' };
  }

  @Post('create-game')
  async createGame(@Body() data: createGameDto) {
    await this.gameService.createGame(data.gameName, data.currency);
    return { status: 'success' };
  }

  @Post('add-gamebet-amount')
  async addGameBetAmount(@Body() data: addMinMaxGameBetDto) {
    await this.gameService.addGameBetAmount(
      data.gameId,
      data.minBet,
      data.maxBet,
    );
    return { status: 'success' };
  }

  @Delete('remove-game')
  async removeGame(@Body() data: deleteGameDto) {
    await this.gameService.removeGame(data.gameId);
    return { status: 'success' };
  }

  @Get('get-game-list')
  async getUserList(@Query() query: getGameListDto) {
    return await this.gameService.getGameList({
      search: query.search,
      skip: query.skip,
      take: query.take,
    });
  }
}
