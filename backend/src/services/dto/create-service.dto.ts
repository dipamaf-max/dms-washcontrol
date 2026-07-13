import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsString()
  stationId: string;
}
