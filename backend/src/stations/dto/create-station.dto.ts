import { IsOptional, IsString } from 'class-validator';

export class CreateStationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  // Only used by ADMIN to create a station on behalf of a specific owner.
  @IsOptional()
  @IsString()
  ownerId?: string;
}
