import {
  Body,
  Controller,
  Get,
  // Param,
  // ParseIntPipe,
  // ParseUUIDPipe,
  // Patch,
  Post,
  Query,
  //Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AccessGuard,
  //AuthenticatedRequest,
  BaseController,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';
import {
  createRoomDto,
  allotManagerDto,
  addWorkerDto,
  getRoomListDto,
  getRoomMachinesDto,
  getMachineGamesDto,
  addMachineDto,
  addGameDto,
} from './dto';
import { RoomService } from './room.service';
@ApiTags('Room')
@ApiBearerAuth()
@Roles(UserType.Admin)
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@Controller('admin')
export class AdminController extends BaseController {
  constructor(private readonly roomService: RoomService) {
    super();
  }

  @Post('create-room')
  async createRoom(@Body() data: createRoomDto) {
    await this.roomService.createRoom(
      data.roomName,
      data.noOfMachines,
      data.noOfSpins,
      data.minJackpot,
      data.maxJackpot,
      data.minBet,
      data.maxBet,
      data.rtp,
      data.currency,
    );
    return { status: 'success' };
  }

  @Get('get-room-list')
  async getRoomList(@Query() query: getRoomListDto) {
    return await this.roomService.getRoomList({
      search: query.search,
      skip: query.skip,
      take: query.take,
    });
  }

  @Post('alot-manager')
  async alotManager(@Body() data: allotManagerDto) {
    await this.roomService.alotManager(data.roomId, data.userId);
    return { status: 'success' };
  }

  @Post('add-machine')
  async alotMachine(@Body() data: addMachineDto) {
    await this.roomService.addMachine(data.roomId, data.machineId);
    return { status: 'success' };
  }

  @Post('add-game')
  async addGame(@Body() data: addGameDto) {
    await this.roomService.addGame(data.machineId, data.gameId, data.roomName);
    return { status: 'success' };
  }

  @Post('add-worker')
  async addWorker(@Body() data: addWorkerDto) {
    await this.roomService.addWorker(data.machineId, data.userId);
    return { status: 'success' };
  }
  @Get('get-room-machines')
  async getRoomMachines(@Query() query: getRoomMachinesDto) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 10;
    const search = query.search ?? '';
    return await this.roomService.getRoomMachines(
      query.roomId,
      search,
      skip,
      take,
    );
  }

  @Get('get-machine-game')
  async getMachineGame(@Query() query: getMachineGamesDto) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 10;
    const search = query.search ?? '';
    return await this.roomService.getMachinesGames(
      query.machineId,
      search,
      skip,
      take,
    );
  }
}
