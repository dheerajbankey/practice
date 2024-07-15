import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class getMachineGamesDto {
  @ApiProperty()
  @IsUUID()
  machineId: string;
}
