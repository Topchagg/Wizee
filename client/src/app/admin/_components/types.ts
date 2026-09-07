export type TreeSubConcept = { id: string; title: string; slug: string };
export type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
export type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
export type TreeSubject = { id: string; title: string; slug: string; themes: TreeTheme[] };

export type PendingDelete = { path: string; kind: string; title: string };

export type Suggestion = {
  id: string;
  type: "THEME" | "CONCEPT" | "SUBCONCEPT";
  title: string;
  createdAt: string;
  subject: { title: string } | null;
  theme: { title: string; subject: { title: string } } | null;
  concept: { title: string; theme: { title: string; subject: { title: string } } } | null;
  suggestedBy: { displayName: string | null; email: string };
};

export type PrereqConcept = { id: string; title: string; themeTitle: string };
export type FlatConcept = { id: string; title: string; themeTitle: string; subjectTitle: string };

// Bundles every handler + expand-state set the tree levels need, so each
// level component (Subject/Theme/Concept row) takes one `actions` prop
// instead of a dozen individual callbacks threaded through by hand.
export type TreeActions = {
  expandedSubjects: Set<string>;
  expandedThemes: Set<string>;
  expandedConcepts: Set<string>;
  onToggleSubject: (id: string) => void;
  onToggleTheme: (id: string) => void;
  onToggleConcept: (id: string) => void;
  onCreateTheme: (subjectId: string, title: string) => Promise<void>;
  onCreateConcept: (themeId: string, title: string) => Promise<void>;
  onCreateSubConcept: (conceptId: string, title: string) => Promise<void>;
  onDeleteSubject: (subject: TreeSubject) => void;
  onDeleteTheme: (theme: TreeTheme) => void;
  onDeleteConcept: (concept: TreeConcept) => void;
  onDeleteSubConcept: (sc: TreeSubConcept) => void;
  onOpenPrereqs: (conceptId: string, conceptTitle: string) => void;
};

export function extractErrorMessage(body: { message?: string | string[] }, fallback: string): string {
  if (Array.isArray(body.message)) return body.message[0] ?? fallback;
  return body.message ?? fallback;
}

// "Suggest a Theme" targets a Subject directly; "Suggest a Concept"/"a
// Sub-concept" target a Theme/Concept, which each carry their own ancestor
// chain — this just reads whichever branch is non-null into one label.
export function suggestionContext(s: Suggestion): string {
  if (s.subject) return s.subject.title;
  if (s.theme) return `${s.theme.subject.title} → ${s.theme.title}`;
  if (s.concept) return `${s.concept.theme.subject.title} → ${s.concept.theme.title} → ${s.concept.title}`;
  return "—";
}

export const SUGGESTION_KIND_LABEL: Record<Suggestion["type"], string> = {
  THEME: "Theme",
  CONCEPT: "Concept",
  SUBCONCEPT: "Sub-concept",
};
