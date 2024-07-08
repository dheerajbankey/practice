import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
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
import { AdminService } from './admin.service';
import {
  AuthenticateRequestDto,
  ChangePasswordRequestDto,
  UpdateProfileDetailsRequestDto,
  UpdateProfileImageRequestDto,
  createUserRequestDto,
  getUserByTypeDto,
  createRoomDto,
  getManagerListDto,
  getWorkerListDto,
  updateStatusDto,
} from './dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserType.Admin)
@UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
@Controller('admin')
export class AdminController extends BaseController {
  constructor(private readonly adminService: AdminService) {
    super();
  }

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest) {
    const ctx = this.getContext(req);
    console.log(ctx);
    return await this.adminService.getProfile(ctx.user.id);
  }

  @Patch()
  async updateProfileDetails(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateProfileDetailsRequestDto,
  ) {
    const ctx = this.getContext(req);
    await this.adminService.updateProfileDetails(
      ctx.user.id,
      data.firstname,
      data.lastname,
      data.email,
    );
    return { status: 'success' };
  }

  @Post('profile-image')
  updateProfileImage(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateProfileImageRequestDto,
  ) {
    const ctx = this.getContext(req);
    return this.adminService.updateProfileImage(ctx.user.id, data.profileImage);
  }

  @Post('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() data: ChangePasswordRequestDto,
  ) {
    const ctx = this.getContext(req);
    await this.adminService.changePassword(
      ctx.user.id,
      data.oldPassword,
      data.newPassword,
    );
    return { status: 'success' };
  }

  @Post('authenticate')
  async authenticate(
    @Req() req: AuthenticatedRequest,
    @Body() data: AuthenticateRequestDto,
  ) {
    const ctx = this.getContext(req);
    console.log('THis si ctx admin di', ctx.user.id);
    await this.adminService.authenticate(ctx.user.id, data.password);
    return { status: 'success' };
  }
  @Post('create-subuser')
  createSubUser(
    @Req() req: AuthenticatedRequest,
    @Body() data: createUserRequestDto,
  ) {
    return this.adminService.createSubUser(
      data.firstname,
      data.lastname,
      data.username,
      data.password,
      data.usertype,
      data.currency,
    );
  }

  @Get('get-all-user')
  async getDetails(@Query() query: getUserByTypeDto) {
    console.log('Ths is getall user');
    const skip = query.skip ?? 0;
    const take = query.take ?? 10;
    const search = query.search ?? '';
    const userType = query.userType ?? '';
    return await this.adminService.getUserByType(userType, search, skip, take);
  }

  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Post('add-amount/:userId/:amount')
  async addAmount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('amount', ParseIntPipe) amount: number,
  ) {
    await this.adminService.addAmount(userId, amount);
    return { status: 'success' };
  }

  @Post('remove-amount/:userId/:amount')
  async removeAmount(
    @Req() req: AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('amount', ParseIntPipe) amount: number,
  ) {
    const ctx = this.getContext(req);
    const adminId = ctx.user.id;
    console.log('THis is adminid', adminId);
    await this.adminService.removeAmount(userId, amount, adminId);
    return { status: 'success' };
  }

  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Post('updatestatus')
  async updateStatus(@Body() data: updateStatusDto) {
    const result = await this.adminService.updateStatus(
      data.userId,
      data.status,
    );
    return { status: result };
  }

  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Post('create-room')
  async createRoom(@Body() data: createRoomDto) {
    return await this.adminService.createRoom(
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
  }
  @Get('get-master-list')
  async getMasterList(@Query() query: getManagerListDto) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 10;
    const search = query.search ?? '';
    return await this.adminService.getMasterList(
      query.userType,
      search,
      skip,
      take,
    );
  }

  @Get('get-worker-list')
  async getWorkerList(@Query() query: getWorkerListDto) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 10;
    const search = query.search ?? '';
    return await this.adminService.getWorkerList(
      query.userType,
      search,
      skip,
      take,
    );
  }
}
