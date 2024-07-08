import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class createRoomDto {
  @ApiPropertyOptional()
  @IsString()
  roomName: string;

  @ApiPropertyOptional()
  @IsInt()
  noOfMachines: number;

  @ApiPropertyOptional()
  @IsInt()
  //@Min(0)
  noOfSpins: number;

  @ApiPropertyOptional()
  @IsInt()
  //@Max()
  minJackpot: number;

  @ApiPropertyOptional()
  @IsInt()
  //@Max(1000)
  maxJackpot: number;

  @ApiPropertyOptional()
  @IsInt()
  //@Max(1000)
  minBet: number;

  @ApiPropertyOptional()
  @IsInt()
  //@Max(1000)
  maxBet: number;

  @ApiPropertyOptional()
  @IsInt()
  rtp: number;

  @ApiPropertyOptional()
  @IsString()
  currency: string;
}
