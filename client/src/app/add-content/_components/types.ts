export type TreeSubConcept = { id: string; title: string };
export type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
export type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
export type TreeSubject = { id: string; title: string; themes: TreeTheme[] };

export type SubConceptSearchHit = {
  subConceptId: string;
  name: string;
  subjectId: string;
  themeId: string;
  themeTitle: string;
  conceptId: string;
  conceptTitle: string;
  contentCount: number;
};

// FILL_GAP and CODE_CHALLENGE are deliberately left out for now — see
// server's TaskDto for why (no working student-facing answer UI yet).
export type TaskType = "MULTIPLE_CHOICE" | "CALCULATION";
export type TaskDraft = {
  id: string;
  type: TaskType;
  prompt: string;
  // Only meaningful for MULTIPLE_CHOICE — built up via "+ Add option"
  // buttons in TaskEditor, not typed as one comma-separated string.
  choices: string[];
  // string for every other task type (free-text answer). For
  // MULTIPLE_CHOICE, an array of the option strings checked as correct —
  // "select one or more" rather than a single radio pick. Submitted as a
  // bare string when exactly one option is checked, so single-answer
  // questions stay identical on the wire to before this existed (see
  // page.tsx's cleanTasks) and the student UI only switches to checkboxes
  // when a question actually has more than one correct answer.
  answer: string | string[];
  isSolvedOnScreen: boolean;
};

// isSolvedOnScreen is fixed at creation time by which section (HW/SW) a task
// was added under — see TasksSection — never toggled afterward.
export const emptyTask = (isSolvedOnScreen = false): TaskDraft => ({
  id: crypto.randomUUID(),
  type: "MULTIPLE_CHOICE",
  prompt: "",
  choices: ["", ""],
  answer: [],
  isSolvedOnScreen,
});

export const PREVIEW_MAX_SECONDS = 45;
