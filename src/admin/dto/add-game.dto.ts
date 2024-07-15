import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class addGameDto {
  @ApiProperty()
  @IsUUID()
  machineId: string;

  @ApiProperty()
  @IsUUID()
  gameId: string;

  @ApiProperty()
  @IsString()
  roomName: string;
}
