import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateColorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'Invalid hex color value' })
  color?: string;
}
