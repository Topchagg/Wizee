import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Tree curation (Subject -> Theme -> Concept -> Sub-concept) is
// SUPERADMIN-only — see readme "Tree Structure & Subject Growth": the shape
// is centrally curated, never community-built. This is the live-app
// equivalent of what prisma/seed.ts does at bootstrap time, for growing the
// tree afterward without a redeploy.
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Appends a unique suffix only on collision — most titles won't collide,
  // so most slugs stay exactly what slugify(title) produces.
  private async uniqueSlug(
    base: string,
    exists: (slug: string) => Promise<boolean>,
  ): Promise<string> {
    const root = slugify(base) || 'item';
    let candidate = root;
    let suffix = 2;
    while (await exists(candidate)) {
      candidate = `${root}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async createSubject(title: string) {
    const [{ _max }, slug] = await Promise.all([
      this.prisma.subject.aggregate({ _max: { order: true } }),
      this.uniqueSlug(title, async (slug) => {
        const existing = await this.prisma.subject.findUnique({
          where: { slug },
          select: { id: true },
        });
        return existing !== null;
      }),
    ]);

    return this.prisma.subject.create({
      data: { title, slug, order: (_max.order ?? -1) + 1 },
    });
  }

  async createTheme(subjectId: string, title: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const { _max } = await this.prisma.theme.aggregate({
      where: { subjectId },
      _max: { order: true },
    });

    const theme = await this.prisma.theme.create({
      data: { subjectId, title, order: (_max.order ?? -1) + 1 },
    });

    await this.prisma.searchTable.create({
      data: { name: theme.title, type: 'THEME', idLink: theme.id, subjectId },
    });

    return theme;
  }

  async createConcept(themeId: string, title: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
      select: { id: true, title: true, subjectId: true },
    });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const { _max } = await this.prisma.concept.aggregate({
      where: { themeId },
      _max: { order: true },
    });

    const concept = await this.prisma.concept.create({
      data: { themeId, title, order: (_max.order ?? -1) + 1 },
    });

    await this.prisma.searchTable.create({
      data: {
        name: concept.title,
        type: 'CONCEPT',
        idLink: concept.id,
        subjectId: theme.subjectId,
        themeId: theme.id,
        themeTitle: theme.title,
      },
    });

    return concept;
  }

  async createSubConcept(conceptId: string, title: string) {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      select: {
        id: true,
        title: true,
        themeId: true,
        theme: { select: { title: true, subjectId: true } },
      },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    const [{ _max }, slug] = await Promise.all([
      this.prisma.subConcept.aggregate({
        where: { conceptId },
        _max: { order: true },
      }),
      this.uniqueSlug(title, async (slug) => {
        const existing = await this.prisma.subConcept.findUnique({
          where: { slug },
          select: { id: true },
        });
        return existing !== null;
      }),
    ]);

    const subConcept = await this.prisma.subConcept.create({
      data: { conceptId, title, slug, order: (_max.order ?? -1) + 1 },
    });

    await this.prisma.searchTable.create({
      data: {
        name: subConcept.title,
        type: 'SUBCONCEPT',
        idLink: subConcept.id,
        subjectId: concept.theme.subjectId,
        themeId: concept.themeId,
        themeTitle: concept.theme.title,
        conceptId: concept.id,
        conceptTitle: concept.title,
      },
    });

    return subConcept;
  }

  // Deletion cascades at the DB level (Theme/Concept/SubConcept and
  // everything under them — SubConceptContent, Test, Attempt, WatchEvent,
  // PathItem, etc. — all have onDelete: Cascade back up to these). The one
  // thing that ISN'T FK-linked is SearchTable (idLink is a polymorphic
  // pointer, not a real foreign key — see its schema comment), so every
  // level's rows for the whole deleted subtree need an explicit sweep first,
  // or the search index would keep pointing at ids that no longer exist.

  async deleteSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    await this.prisma.searchTable.deleteMany({ where: { subjectId: id } });
    await this.prisma.subject.delete({ where: { id } });
  }

  async deleteTheme(id: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    // idLink covers this Theme's own SearchTable row; themeId covers every
    // descendant Concept/SubConcept row (see buildSearchRows in seed.ts).
    await this.prisma.searchTable.deleteMany({
      where: { OR: [{ idLink: id }, { themeId: id }] },
    });
    await this.prisma.theme.delete({ where: { id } });
  }

  async deleteConcept(id: string) {
    const concept = await this.prisma.concept.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    await this.prisma.searchTable.deleteMany({
      where: { OR: [{ idLink: id }, { conceptId: id }] },
    });
    await this.prisma.concept.delete({ where: { id } });
  }

  async deleteSubConcept(id: string) {
    const subConcept = await this.prisma.subConcept.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!subConcept) {
      throw new NotFoundException('Sub-concept not found');
    }
    await this.prisma.searchTable.deleteMany({ where: { idLink: id } });
    await this.prisma.subConcept.delete({ where: { id } });
  }
}
