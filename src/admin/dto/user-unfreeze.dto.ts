import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class userUnFreezeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  machineNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiProperty()
  @IsString()
  status: Status;
}
