import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class createRoomDto {
  @ApiPropertyOptional()
  @IsString()
  roomName: string;

  @ApiPropertyOptional()
  @IsString()
  noOfMachines: string;

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
  rtp: number;

  @ApiPropertyOptional()
  @IsString()
  currency: string;
}
