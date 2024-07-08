import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import {
  AuthenticatedRequest,
  BaseController,
  JwtAuthGuard,
  RolesGuard,
  UserType,
  Roles,
  AccessGuard,
} from '@Common';
import { UsersService } from './users.service';
import {
  ChangePasswordRequestDto,
  GetUsersRequestDto,
  UpdateProfileDetailsRequestDto,
  UpdateProfileImageRequestDto,
  UpdateUserProfileRequestDto,
} from './dto';

@ApiTags('User')
@ApiBearerAuth()
//@UseGuards(JwtAuthGuard, AccessGuard)
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  // @Roles(UserType.Admin)
  // @UseGuards(RolesGuard)
  @Get()
  async getUsers(@Query() query: GetUsersRequestDto) {
    return await this.usersService.getAll({
      search: query.search,
      skip: query.skip,
      take: query.take,
    });
  }

  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const ctx = this.getContext(req);
    console.log(ctx);
    return await this.usersService.getProfile(ctx.user.id, ctx.user.type);
  }

  @Patch('me')
  async updateProfileDetails(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateProfileDetailsRequestDto,
  ) {
    // if (data.mobile && (!data.dialCode || !data.country)) {
    //   throw new BadRequestException();
    // }
    const ctx = this.getContext(req);
    console.log('This is ctx', ctx);
    console.log('This is req.body', req.body);
    const type = ctx.user.type;
    if (type !== 'admin') {
      await this.usersService.updateProfileDetails({
        userId: ctx.user.id,
        username: data.username,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        dialCode: data.dialCode,
        mobile: data.mobile,
        country: data.country,
      });
      return { status: 'success' };
    } else {
      await this.usersService.updateProfileDetailsOFAdmin({
        userId: ctx.user.id,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
      });
      return { status: 'success' };
    }
  }

  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Get(':userId')
  async getUserProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.usersService.getProfile(userId);
  }

  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Patch(':userId')
  async updateUserProfileDetails(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() data: UpdateUserProfileRequestDto,
  ) {
    return await this.usersService.updateProfileDetailsByAdministrator({
      userId,
      username: data.username,
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      dialCode: data.dialCode,
      mobile: data.mobile,
      country: data.country,
      password: data.password,
    });
  }

  @Post('me/profile-image')
  updateProfileImage(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateProfileImageRequestDto,
  ) {
    const ctx = this.getContext(req);
    return this.usersService.updateProfileImage(ctx.user.id, data.profileImage);
  }

  @Post('me/change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() data: ChangePasswordRequestDto,
  ) {
    const ctx = this.getContext(req);
    const type = ctx.user.type;
    if (type !== 'admin') {
      await this.usersService.changePassword(
        ctx.user.id,
        data.oldPassword,
        data.newPassword,
      );
      return { status: 'success' };
    } else {
      await this.usersService.adminChangePassword(
        ctx.user.id,
        data.oldPassword,
        data.newPassword,
      );
      return { status: 'success' };
    }
  }

  @ApiParam({ name: 'status', enum: UserStatus })
  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Post(':userId/:status')
  async setUserStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('status', new ParseEnumPipe(UserStatus)) status: UserStatus,
  ) {
    console.log('This is userid', userId);
    await this.usersService.setStatus(userId, status);
    return { status: 'success' };
  }

  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Get('checkstatus/:userId')
  async checkStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    const result = await this.usersService.checkStatus(userId);
    return { status: result };
  }

  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Post('add-amount/:userId/:amount')
  async addAmount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('amount', ParseIntPipe) amount: number,
  ) {
    await this.usersService.addAmount(userId, amount);
    return { status: 'success' };
  }
  @Roles(UserType.Admin)
  @UseGuards(RolesGuard)
  @Post('remove-amount/:userId/:amount')
  async removeAmount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('amount', ParseIntPipe) amount: number,
  ) {
    await this.usersService.removeAmount(userId, amount);
    return { status: 'success' };
  }
}
