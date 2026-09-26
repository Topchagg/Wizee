import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// FILL_GAP and CODE_CHALLENGE exist on the Prisma QuestionType enum but are
// deliberately not offered here for now — neither has a working
// student-facing answer UI yet (HwTaskCard/SolvedTaskCard only render
// choice buttons), so authoring one today would create an unanswerable
// task. Re-add here once that UI exists.
const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'CALCULATION'] as const;

export class TaskDto {
  @IsIn(QUESTION_TYPES)
  type: (typeof QUESTION_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  choices?: unknown;

  @IsNotEmpty()
  answer: unknown;

  // false (default): a normal HW task — what the Test step starts on. true:
  // a duplicate of a task actually solved in the video — never the step's
  // starting task, only reachable by rolling when stuck on an HW task.
  @IsOptional()
  @IsBoolean()
  isSolvedOnScreen?: boolean;
}
