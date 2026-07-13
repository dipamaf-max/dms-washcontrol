import { IsIn, IsOptional, IsString } from 'class-validator';

export class AddPhotoDto {
  @IsString()
  url: string;

  @IsIn(['before', 'after'])
  stage: 'before' | 'after';

  @IsOptional()
  @IsString()
  washOrderId?: string;
}
