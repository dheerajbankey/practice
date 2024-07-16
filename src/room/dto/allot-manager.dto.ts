import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class allotManagerDto {
  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;
}
