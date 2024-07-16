import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class updateStatusDto {
  @ApiPropertyOptional()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsEnum(UserStatus)
  status: UserStatus;
}
