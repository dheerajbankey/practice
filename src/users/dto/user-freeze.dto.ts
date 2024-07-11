import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class userFreezeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  status: string;
}
