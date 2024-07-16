import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class addGameDto {
  @ApiProperty()
  @IsUUID()
  machineId: string;

  @ApiProperty()
  @IsUUID()
  gameId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomName?: string;
}
