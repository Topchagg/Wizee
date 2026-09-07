export type TestInfo = {
  id: string;
  type: string;
  prompt: string;
  choices: unknown;
  contentId?: string;
  // Only present on this content's own homework tasks (toContentDto) — never
  // on solved-on-screen tasks rolled in from a sibling content's own
  // endpoint, and null/0 unless the viewer is this content's creator.
  attemptedCount?: number;
  passRate?: number | null;
};

export type ContentInfo = {
  id: string;
  video: string;
  previewVideo: string | null;
  description: string | null;
  creatorName: string | null;
  creatorId: string | null;
  creatorPhotoUrl: string | null;
  tests: TestInfo[];
  solvedOnScreenCount: number;
  attemptedCount: number;
  passRate: number | null;
  skipRate: number | null;
};

export type SiblingSubConcept = { id: string; slug: string; title: string; contentId: string | null };
export type BuildsOnEntry = { id: string; title: string; themeTitle: string; slug: string; contentId: string };

export type SubConceptDetail = {
  id: string;
  slug: string;
  title: string;
  breadcrumb: { subject: string; theme: string; concept: string };
  content: ContentInfo | null;
  contentCount: number;
  masteredCount: number;
  siblings: SiblingSubConcept[];
  buildsOn: BuildsOnEntry[];
};

export type Step = "preview" | "video" | "test";
export type TaskResult = "passed" | "failed";
export type StepMeta = { key: Step; label: string; caption: string };
