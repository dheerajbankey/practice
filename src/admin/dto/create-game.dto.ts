import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class createGameDto {
  @ApiProperty()
  @IsString()
  gameName: string;

  @ApiProperty()
  @IsString()
  currency: string;
}
