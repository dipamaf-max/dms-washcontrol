import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Public self-registration always creates a STATION OWNER account (see AuthService.register).
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;
}
