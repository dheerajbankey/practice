import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class addMachineDto {
  @ApiProperty()
  @IsUUID()
  roomId: string;

  @ApiProperty()
  @IsUUID()
  machineId: string;
}
