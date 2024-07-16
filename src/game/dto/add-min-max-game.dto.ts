import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID } from 'class-validator';

export class addMinMaxGameBetDto {
  @ApiProperty()
  @IsUUID()
  gameId: string;

  @ApiProperty()
  @IsInt()
  minBet: number;

  @ApiProperty()
  @IsInt()
  maxBet: number;
}
