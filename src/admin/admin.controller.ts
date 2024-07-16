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
  getUserListDto,
  updateStatusDto,
  userUnFreezeDto,
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

  @Post('add-amount/:userId/:amount')
  async addAmount(
    @Req() req: AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('amount', ParseIntPipe) amount: number,
  ) {
    const ctx = this.getContext(req);
    const adminId = ctx.user.id;
    await this.adminService.addAmount(userId, amount, adminId);
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
    await this.adminService.removeAmount(userId, amount, adminId);
    return { status: 'success' };
  }

  @Post('updatestatus')
  async updateStatus(@Body() data: updateStatusDto) {
    const result = await this.adminService.updateStatus(
      data.userId,
      data.status,
    );
    return { status: result };
  }
  @Patch('unfreeze')
  async unfreeze(
    @Req() req: AuthenticatedRequest,
    @Body() data: userUnFreezeDto,
  ) {
    await this.adminService.unfreeze(
      data.id,
      data.status,
      data.machineNo,
      data.roomName,
    );
    return { status: 'success' };
  }

  @Get('get-user-list')
  async getUserList(@Query() query: getUserListDto) {
    return await this.adminService.getUserList({
      search: query.search,
      skip: query.skip,
      take: query.take,
      UserType: query.userType,
    });
  }
}
