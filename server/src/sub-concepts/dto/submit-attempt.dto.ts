import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAttemptDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  // A content can now have several video tasks (the Test step's "roll"
  // pulls from them) so grading needs to know exactly which one was
  // answered, not just "the" task for this content.
  @IsString()
  @IsNotEmpty()
  taskId: string;

  // Shape depends on the Test.type; graded generically (deep-equal against
  // the stored answer) at the service layer. Needs at least one decorator or
  // the global ValidationPipe's `whitelist` strips it.
  @IsNotEmpty()
  answer: unknown;
}
