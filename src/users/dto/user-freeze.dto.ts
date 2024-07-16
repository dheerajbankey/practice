import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsString, IsUUID } from 'class-validator';

export class userFreezeDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  status: Status;
}
