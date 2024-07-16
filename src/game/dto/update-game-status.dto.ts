import { ApiProperty } from '@nestjs/swagger';
import { GameStatus } from '@prisma/client';
import { IsString } from 'class-validator';

export class updateGameStatusDto {
  @ApiProperty()
  @IsString()
  gameId: string;

  @ApiProperty()
  @IsString()
  status: GameStatus;
}
