import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class addWorkerDto {
  @ApiProperty()
  @IsUUID()
  machineId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;
}
