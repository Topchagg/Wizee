export type TreeSubConcept = { id: string; title: string; slug: string; contentCount: number; primaryContentId: string | null };
export type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
export type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
export type TreeSubject = { id: string; title: string; slug: string; themes: TreeTheme[] };

export type SuggestTarget = {
  // What the suggestion becomes once approved, and which existing node it
  // hangs off of — see server/src/suggestions for the matching endpoints.
  kind: "theme" | "concept" | "sub-concept";
  parentId: string;
  parentLabel: string;
  placeholder: string;
};
