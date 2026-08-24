import { IsIn, IsOptional, IsString } from 'class-validator';

export class AddPathItemDto {
  @IsIn(['THEME', 'CONCEPT'])
  itemType: 'THEME' | 'CONCEPT';

  @IsOptional()
  @IsString()
  themeId?: string;

  @IsOptional()
  @IsString()
  conceptId?: string;
}
