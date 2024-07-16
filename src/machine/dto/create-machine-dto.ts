import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class createMachineDto {
  // @ApiProperty()
  // @IsUUID()
  // adminId: string;

  @ApiProperty()
  @IsString()
  machineNo: string;

  @ApiProperty()
  @IsInt()
  balance: number;
}
