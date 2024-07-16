import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class createMachineDto {
  @ApiProperty()
  @IsString()
  machineNo: string;

  @ApiProperty()
  @IsInt()
  balance: number;
}
