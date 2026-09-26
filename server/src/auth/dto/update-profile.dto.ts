import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  // Set by uploading to Firebase Storage client-side first, same pattern as
  // video uploads — this only ever receives the resulting download URL.
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
