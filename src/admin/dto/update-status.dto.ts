import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class updateStatusDto {
  @ApiPropertyOptional()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsString()
  status: string;
}
