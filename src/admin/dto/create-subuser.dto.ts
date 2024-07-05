import { ApiProperty } from '@nestjs/swagger';
import {
  //IsEmail,
  IsNotEmpty,
  //   IsNumber,
  //   IsOptional,
  //   IsPhoneNumber,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class createUserRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsStrongPassword()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  usertype: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency: string;
  //   @ApiPropertyOptional()
  //   @IsOptional()
  //   @IsString()
  //   @IsNotEmpty()
  //   dialCode?: string;

  //   @ApiPropertyOptional()
  //   @IsOptional()
  //   @IsPhoneNumber(undefined, {
  //     message:
  //       'The mobile number you entered is invalid, please provide a valid mobile number',
  //   })
  //   mobile?: string;

  //   @ApiProperty()
  //   @IsString()
  //   @IsNotEmpty()
  //   country: string;

  // @ApiProperty()
  // @IsString()
  // emailVerificationCode: string;

  //   @ApiProperty()
  //   @IsNumber()
  //   credit: number;

  //   @ApiProperty()
  //   @IsNumber()
  //   balance: number;

  //   @ApiPropertyOptional()
  //   @IsOptional()
  //   @IsString()
  //   mobileVerificationCode?: string;
}
