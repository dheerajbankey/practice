import { SearchablePaginatedDto, UserType } from '@Common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class getUserListDto extends SearchablePaginatedDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;
}
