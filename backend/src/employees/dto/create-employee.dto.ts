import { IsEmail, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  stationId: string;

  @IsString()
  position: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;
}
