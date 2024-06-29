import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginRequestDto {
  // @ApiPropertyOptional()
  // @IsOptional()
  // @IsEmail()
  // email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
