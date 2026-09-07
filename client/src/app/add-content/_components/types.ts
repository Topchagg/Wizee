export type TreeSubConcept = { id: string; title: string };
export type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
export type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
export type TreeSubject = { id: string; title: string; themes: TreeTheme[] };

export type TaskType = "MULTIPLE_CHOICE" | "FILL_GAP" | "CALCULATION" | "CODE_CHALLENGE";
export type TaskDraft = { type: TaskType; prompt: string; choicesText: string; answer: string; isSolvedOnScreen: boolean };

export const emptyTask = (): TaskDraft => ({
  type: "MULTIPLE_CHOICE",
  prompt: "",
  choicesText: "",
  answer: "",
  isSolvedOnScreen: false,
});

export const PREVIEW_MAX_SECONDS = 45;
