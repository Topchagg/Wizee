import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TaskDto } from './task.dto';

// One teacher's contribution to an EXISTING Sub-concept slot — the only
// content-creation capability a Teacher user has. Does not create or modify
// the tree itself (Subject/Theme/Concept/SubConcept stay admin/seed-only).
export class AddContentDto {
  @IsString()
  @IsNotEmpty()
  video: string;

  @IsString()
  @IsNotEmpty()
  previewVideo: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  creatorName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskDto)
  tasks?: TaskDto[];
}
