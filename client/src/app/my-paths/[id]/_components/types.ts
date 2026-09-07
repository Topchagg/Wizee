export type PathItem = {
  id: string;
  order: number;
  itemType: "THEME" | "CONCEPT";
  label: string;
  themeId: string | null;
  conceptId: string | null;
};
export type PathDetail = { id: string; title: string; description: string | null; isPublic: boolean; items: PathItem[] };

export type TreeSubConcept = { id: string; title: string };
export type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
export type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
export type TreeSubject = { id: string; title: string; themes: TreeTheme[] };

export type SearchHit = {
  name: string;
  type: "THEME" | "CONCEPT" | "SUBCONCEPT";
  idLink: string;
  themeId: string | null;
  themeTitle: string | null;
  conceptId: string | null;
  conceptTitle: string | null;
};

export type MissingPrerequisite = { id: string; title: string; themeTitle: string };

export type AddItem = (itemType: "THEME" | "CONCEPT", themeId?: string, conceptId?: string) => void;
