import {
  Body,
  Controller,
  //   Get,
  //   Param,
  //   ParseIntPipe,
  //   ParseUUIDPipe,
  Patch,
  Post,
  //   Query,
  //   Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AccessGuard,
  // AuthenticatedRequest,
  BaseController,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';
import { GameService } from './game.service';
import { createGameDto, updateGameStatusDto, addMinMaxGameBetDto } from './dto';

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
}
