import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AccessGuard,
  AuthenticatedRequest,
  BaseController,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';
import { createMachineDto, getMachineListDto } from './dto';
import { MachineService } from './machine.service';

@ApiTags('Machine')
@ApiBearerAuth()
@Roles(UserType.Admin)
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@Controller('machine')
export class MachineController extends BaseController {
  constructor(private readonly machineService: MachineService) {
    super();
  }

  @Post('create-machine')
  async createMachine(
    @Req() req: AuthenticatedRequest,
    @Body() data: createMachineDto,
  ) {
    const ctx = this.getContext(req);
    const adminid = ctx.user.id;
    await this.machineService.createMachine(
      adminid,
      data.machineNo,
      data.balance,
    );
    return { status: 'success' };
  }

  @Get('get-machine-list')
  async getMachineList(@Query() query: getMachineListDto) {
    return await this.machineService.getMachineList({
      search: query.search,
      skip: query.skip,
      take: query.take,
    });
  }
}
