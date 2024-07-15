import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class getRoomMachinesDto {
  @ApiProperty()
  @IsUUID()
  roomId: string;
}
