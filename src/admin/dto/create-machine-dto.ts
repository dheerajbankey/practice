import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class createMachineDto {
  @ApiPropertyOptional()
  @IsString()
  machineNo: string;

  @ApiPropertyOptional()
  @IsInt()
  balance: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roomId?: string;
}
