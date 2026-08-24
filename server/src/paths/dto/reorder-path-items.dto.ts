import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderPathItemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  itemIds: string[];
}
