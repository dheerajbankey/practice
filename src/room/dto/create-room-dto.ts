import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class createRoomDto {
  @ApiProperty()
  @IsString()
  roomName: string;

  @ApiProperty()
  @IsInt()
  noOfMachines: number;

  @ApiProperty()
  @IsInt()
  //@Min(0)
  noOfSpins: number;

  @ApiProperty()
  @IsInt()
  //@Max()
  minJackpot: number;

  @ApiProperty()
  @IsInt()
  //@Max(1000)
  maxJackpot: number;

  @ApiProperty()
  @IsInt()
  //@Max(1000)
  minBet: number;

  @ApiProperty()
  @IsInt()
  //@Max(1000)
  maxBet: number;

  @ApiProperty()
  @IsInt()
  rtp: number;

  @ApiProperty()
  @IsString()
  currency: string;
}
