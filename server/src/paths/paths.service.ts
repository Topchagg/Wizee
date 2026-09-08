import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrerequisitesService } from '../prerequisites/prerequisites.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddPathItemDto } from './dto/add-path-item.dto';

@Injectable()
export class PathsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prerequisites: PrerequisitesService,
  ) {}

  async listPublic() {
    const paths = await this.prisma.learningPath.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { displayName: true, email: true } },
        items: { select: { itemType: true, themeId: true, conceptId: true } },
      },
    });

    // Completeness needs each path's Concept items' prerequisite edges, and
    // each path's Theme items' own Concepts — fetched ONCE across every
    // public Path here (not per path — see paths/paths.service.ts audit),
    // so this whole method stays at 2 queries total no matter how many
    // public Paths exist.
    const allConceptIds = [
      ...new Set(
        paths.flatMap((p) =>
          p.items
            .filter((i) => i.itemType === 'CONCEPT' && i.conceptId)
            .map((i) => i.conceptId!),
        ),
      ),
    ];
    const allThemeIds = [
      ...new Set(
        paths.flatMap((p) =>
          p.items
            .filter((i) => i.itemType === 'THEME' && i.themeId)
            .map((i) => i.themeId!),
        ),
      ),
    ];
    const [edges, themeConcepts] = await Promise.all([
      allConceptIds.length
        ? this.prisma.conceptPrerequisite.findMany({
            where: { conceptId: { in: allConceptIds } },
            select: { conceptId: true, requiresConceptId: true },
          })
        : Promise.resolve([]),
      allThemeIds.length
        ? this.prisma.concept.findMany({
            where: { themeId: { in: allThemeIds } },
            select: { id: true, themeId: true },
          })
        : Promise.resolve([]),
    ]);

    const requiredIdsByConceptId = new Map<string, string[]>();
    for (const e of edges) {
      const list = requiredIdsByConceptId.get(e.conceptId) ?? [];
      list.push(e.requiresConceptId);
      requiredIdsByConceptId.set(e.conceptId, list);
    }
    const conceptIdsByThemeId = new Map<string, string[]>();
    for (const c of themeConcepts) {
      const list = conceptIdsByThemeId.get(c.themeId) ?? [];
      list.push(c.id);
      conceptIdsByThemeId.set(c.themeId, list);
    }

    // Readme 2.2: paths built only from Concepts (precise, not just "a whole
    // Theme") should be rated higher — a simple ratio stands in for the
    // "smarter algorithm" the readme defers to post-MVP. `completeness`
    // layers the prerequisite graph on top of that: a Concept-based path that
    // also covers its Concepts' direct prerequisites (as its own CONCEPT
    // item, or via a THEME item covering that prerequisite's Theme) scores
    // higher than one with the same conceptRatio but real gaps.
    const scored = paths.map((path) => {
      const itemCount = path.items.length;
      const conceptItems = path.items.filter((i) => i.itemType === 'CONCEPT');
      const conceptRatio =
        itemCount === 0 ? 0 : conceptItems.length / itemCount;

      const covered = new Set(conceptItems.map((i) => i.conceptId!));
      for (const item of path.items) {
        if (item.itemType === 'THEME' && item.themeId) {
          (conceptIdsByThemeId.get(item.themeId) ?? []).forEach((id) =>
            covered.add(id),
          );
        }
      }
      const requiredIds = conceptItems.flatMap(
        (i) => requiredIdsByConceptId.get(i.conceptId!) ?? [],
      );
      const completeness =
        requiredIds.length === 0
          ? 1
          : requiredIds.filter((id) => covered.has(id)).length /
            requiredIds.length;

      return {
        id: path.id,
        title: path.title,
        description: path.description,
        createdBy: path.user.displayName ?? path.user.email,
        itemCount,
        conceptRatio,
        completeness,
      };
    });

    return scored.sort(
      (a, b) =>
        b.conceptRatio * 0.7 +
        b.completeness * 0.3 -
        (a.conceptRatio * 0.7 + a.completeness * 0.3),
    );
  }

  // A path "covers" a Concept if it was added directly, or if a THEME item
  // for that Concept's own Theme was added (the Theme item stands in for
  // every Concept under it — see resolve()'s flattening).
  private async getCoveredConceptIds(
    items: {
      itemType: string;
      themeId: string | null;
      conceptId: string | null;
    }[],
  ): Promise<Set<string>> {
    const covered = new Set(
      items
        .filter((i) => i.itemType === 'CONCEPT' && i.conceptId)
        .map((i) => i.conceptId!),
    );
    const themeIds = items
      .filter((i) => i.itemType === 'THEME' && i.themeId)
      .map((i) => i.themeId!);
    if (themeIds.length > 0) {
      const themeConcepts = await this.prisma.concept.findMany({
        where: { themeId: { in: themeIds } },
        select: { id: true },
      });
      themeConcepts.forEach((c) => covered.add(c.id));
    }
    return covered;
  }

  async listMine(userId: string) {
    const paths = await this.prisma.learningPath.findMany({
      where: { userId },
      include: { items: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return paths.map((path) => ({
      id: path.id,
      title: path.title,
      description: path.description,
      isPublic: path.isPublic,
      itemCount: path.items.length,
    }));
  }

  // Browsable Subject -> Theme -> Concept -> SubConcept structure for the
  // path builder. Sub-concepts are shown for context/navigation only — per
  // readme 2.2, a path item can only be a Theme or a Concept, never an
  // individual Sub-concept, so they're never an "addable" row client-side.
  async getTree() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: { order: 'asc' },
      include: {
        themes: {
          orderBy: { order: 'asc' },
          include: {
            concepts: {
              orderBy: { order: 'asc' },
              include: {
                subConcepts: {
                  orderBy: { order: 'asc' },
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
    });

    return subjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      themes: subject.themes.map((theme) => ({
        id: theme.id,
        title: theme.title,
        concepts: theme.concepts.map((concept) => ({
          id: concept.id,
          title: concept.title,
          subConcepts: concept.subConcepts,
        })),
      })),
    }));
  }

  // Backed by SearchTable (see its schema comment) rather than searching
  // Theme/Concept/SubConcept directly — a hit below Concept level still
  // carries its ancestor Concept/Theme so the client can offer the right
  // "Add" target even though only Themes/Concepts are addable.
  async search(subjectId: string, query: string) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const rows = await this.prisma.searchTable.findMany({
      where: { subjectId, name: { contains: trimmed, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return rows.map((row) => ({
      name: row.name,
      type: row.type,
      idLink: row.idLink,
      themeId: row.themeId,
      themeTitle: row.themeTitle,
      conceptId: row.conceptId,
      conceptTitle: row.conceptTitle,
    }));
  }

  async createDraft(userId: string, title: string, description?: string) {
    return this.prisma.learningPath.create({
      data: { userId, title, description, isPublic: false },
    });
  }

  async getDetail(pathId: string, userId: string) {
    await this.assertOwnership(pathId, userId);

    const path = await this.prisma.learningPath.findUniqueOrThrow({
      where: { id: pathId },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            theme: { select: { title: true } },
            concept: { select: { title: true } },
          },
        },
      },
    });

    return {
      id: path.id,
      title: path.title,
      description: path.description,
      isPublic: path.isPublic,
      items: path.items.map((item) => ({
        id: item.id,
        order: item.order,
        itemType: item.itemType,
        label:
          item.itemType === 'THEME' ? item.theme?.title : item.concept?.title,
        themeId: item.themeId,
        conceptId: item.conceptId,
      })),
    };
  }

  async addItem(pathId: string, userId: string, dto: AddPathItemDto) {
    await this.assertOwnership(pathId, userId);

    if (dto.itemType === 'THEME' && !dto.themeId) {
      throw new BadRequestException('themeId is required for a THEME item');
    }
    if (dto.itemType === 'CONCEPT' && !dto.conceptId) {
      throw new BadRequestException('conceptId is required for a CONCEPT item');
    }

    const count = await this.prisma.pathItem.count({ where: { pathId } });
    const item = await this.prisma.pathItem.create({
      data: {
        pathId,
        order: count + 1,
        itemType: dto.itemType,
        themeId: dto.itemType === 'THEME' ? dto.themeId : null,
        conceptId: dto.itemType === 'CONCEPT' ? dto.conceptId : null,
      },
    });

    // Suggestion only, never blocking (see prerequisites spec) — a Path
    // creator may have a valid reason to omit a prerequisite, e.g. a
    // review-only Path for someone who already knows it.
    const missingPrerequisites =
      dto.itemType === 'CONCEPT' && dto.conceptId
        ? await this.getMissingPrerequisites(pathId, dto.conceptId)
        : [];

    return { ...item, missingPrerequisites };
  }

  // The newly-added Concept's full prerequisite chain, minus whatever the
  // path already covers (its own CONCEPT items, or a THEME item for a
  // prerequisite's Theme).
  private async getMissingPrerequisites(pathId: string, conceptId: string) {
    const chain = await this.prerequisites.listTransitive(conceptId);
    if (chain.length === 0) return [];

    const items = await this.prisma.pathItem.findMany({
      where: { pathId },
      select: { itemType: true, themeId: true, conceptId: true },
    });
    const coveredConceptIds = await this.getCoveredConceptIds(items);
    return chain.filter((c) => !coveredConceptIds.has(c.id));
  }

  async removeItem(
    pathId: string,
    userId: string,
    itemId: string,
  ): Promise<void> {
    await this.assertOwnership(pathId, userId);
    await this.prisma.pathItem.delete({ where: { id: itemId } });
  }

  async reorderItems(
    pathId: string,
    userId: string,
    itemIds: string[],
  ): Promise<void> {
    await this.assertOwnership(pathId, userId);

    // @@unique([pathId, order]) means a direct 1->2, 2->1 swap collides
    // mid-transaction. Two-phase move: park everything at distinct negative
    // positions first, then set final positions — neither phase can collide.
    await this.prisma.$transaction([
      ...itemIds.map((id, index) =>
        this.prisma.pathItem.update({
          where: { id },
          data: { order: -1 * (index + 1) },
        }),
      ),
      ...itemIds.map((id, index) =>
        this.prisma.pathItem.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    ]);
  }

  async publish(pathId: string, userId: string) {
    await this.assertOwnership(pathId, userId);

    const itemCount = await this.prisma.pathItem.count({ where: { pathId } });
    if (itemCount === 0) {
      throw new BadRequestException('Add at least one item before publishing');
    }

    return this.prisma.learningPath.update({
      where: { id: pathId },
      data: { isPublic: true },
    });
  }

  async deletePath(pathId: string, userId: string): Promise<void> {
    await this.assertOwnership(pathId, userId);
    await this.prisma.learningPath.delete({ where: { id: pathId } });
  }

  // Flattens a path's Theme/Concept items into the ordered SubConcept sequence
  // that's actually played back — per the readme, users pick Themes/Concepts to
  // build a path, but what a learner sees is always the underlying SubConcept videos.
  async resolve(pathId: string, userId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            theme: {
              include: {
                concepts: {
                  orderBy: { order: 'asc' },
                  include: {
                    subConcepts: {
                      orderBy: { order: 'asc' },
                      select: { id: true },
                    },
                  },
                },
              },
            },
            concept: {
              include: {
                subConcepts: {
                  orderBy: { order: 'asc' },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!path) {
      throw new NotFoundException('Path not found');
    }
    if (!path.isPublic && path.userId !== userId) {
      throw new ForbiddenException('This path is not published yet');
    }

    // A THEME item and one of its own CONCEPT items can legitimately both
    // appear in the same path — de-dupe (keep first occurrence) so a
    // sub-concept never plays twice back-to-back.
    const seen = new Set<string>();
    const subConceptIds: string[] = [];
    const pushUnique = (id: string) => {
      if (!seen.has(id)) {
        seen.add(id);
        subConceptIds.push(id);
      }
    };

    for (const item of path.items) {
      if (item.itemType === 'THEME' && item.theme) {
        for (const concept of item.theme.concepts) {
          concept.subConcepts.forEach((sc) => pushUnique(sc.id));
        }
      } else if (item.itemType === 'CONCEPT' && item.concept) {
        item.concept.subConcepts.forEach((sc) => pushUnique(sc.id));
      }
    }

    // The /learn URL is slug + content-id based, so the resolved sequence
    // needs both, not just the raw SubConcept id used for de-duping above.
    const withContent = await this.prisma.subConcept.findMany({
      where: { id: { in: subConceptIds } },
      select: {
        id: true,
        slug: true,
        contents: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 1,
          select: { id: true },
        },
      },
    });
    const bySubConceptId = new Map(withContent.map((sc) => [sc.id, sc]));

    // A Sub-concept with no content yet is a curriculum-shape placeholder,
    // not something a learner can actually watch/pass — it must never be a
    // stop in the played sequence (otherwise the very first slot in a
    // freshly-curated path can silently make the whole path unplayable,
    // even once everything after it has real content).
    const subConcepts = subConceptIds
      .map((id) => {
        const sc = bySubConceptId.get(id)!;
        return {
          id: sc.id,
          slug: sc.slug,
          contentId: sc.contents[0]?.id ?? null,
        };
      })
      .filter(
        (sc): sc is { id: string; slug: string; contentId: string } =>
          sc.contentId !== null,
      );

    return { id: path.id, title: path.title, subConcepts };
  }

  // For the /progress page — how far the current user has gotten through
  // each public path, in terms of Sub-concepts already passed. Mirrors
  // resolve()'s Theme/Concept -> Sub-concept flattening (kept separate
  // rather than shared, since the two select different Sub-concept fields).
  // Also picks out the next not-yet-passed Sub-concept (slug + primary
  // content id) so the client's "Continue" button can resume in place
  // instead of always restarting the path from the beginning.
  async getProgress(userId: string) {
    const paths = await this.prisma.learningPath.findMany({
      where: { isPublic: true },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            theme: {
              include: {
                concepts: {
                  orderBy: { order: 'asc' },
                  include: {
                    subConcepts: {
                      orderBy: { order: 'asc' },
                      select: {
                        id: true,
                        slug: true,
                        title: true,
                        contents: {
                          orderBy: [
                            { isPrimary: 'desc' },
                            { createdAt: 'asc' },
                          ],
                          take: 1,
                          select: { id: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            concept: {
              include: {
                subConcepts: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    contents: {
                      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
                      take: 1,
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    type FlatSubConcept = {
      id: string;
      slug: string;
      title: string;
      contentId: string;
    };

    const flattened = paths.map((path) => {
      const seen = new Set<string>();
      const subConcepts: FlatSubConcept[] = [];
      // A Sub-concept with no content yet is a curriculum-shape placeholder,
      // not something a learner can actually watch/pass — skip it entirely
      // so it never inflates `total` or gets permanently stuck as "next"
      // (it can never be marked passed, since there's nothing to attempt).
      const pushUnique = (sc: {
        id: string;
        slug: string;
        title: string;
        contents: { id: string }[];
      }) => {
        const contentId = sc.contents[0]?.id;
        if (!contentId || seen.has(sc.id)) return;
        seen.add(sc.id);
        subConcepts.push({
          id: sc.id,
          slug: sc.slug,
          title: sc.title,
          contentId,
        });
      };
      for (const item of path.items) {
        if (item.itemType === 'THEME' && item.theme) {
          for (const concept of item.theme.concepts) {
            concept.subConcepts.forEach(pushUnique);
          }
        } else if (item.itemType === 'CONCEPT' && item.concept) {
          item.concept.subConcepts.forEach(pushUnique);
        }
      }
      return { path, subConcepts };
    });

    const allIds = [
      ...new Set(flattened.flatMap((f) => f.subConcepts.map((sc) => sc.id))),
    ];
    const passedAttempts = allIds.length
      ? await this.prisma.attempt.findMany({
          where: { userId, subConceptId: { in: allIds }, passed: true },
          select: { subConceptId: true },
          distinct: ['subConceptId'],
        })
      : [];
    const passedSet = new Set(passedAttempts.map((a) => a.subConceptId));

    return flattened.map(({ path, subConcepts }) => {
      const passedCount = subConcepts.filter((sc) =>
        passedSet.has(sc.id),
      ).length;
      // First not-yet-passed Sub-concept to resume at, or the last one (to
      // review) once everything in the path has been passed.
      const next =
        subConcepts.find((sc) => !passedSet.has(sc.id)) ??
        subConcepts[subConcepts.length - 1];
      return {
        id: path.id,
        title: path.title,
        description: path.description,
        total: subConcepts.length,
        passedCount,
        nextSlug: next?.slug ?? null,
        nextTitle: next?.title ?? null,
        nextContentId: next?.contentId ?? null,
      };
    });
  }

  // For the home page's daily nudge — has the user passed a Sub-concept
  // today, what did they last pass, and what's next in the "default" Path
  // (the same top-rated public one "Start default Path" jumps into).
  async getDailyStatus(userId: string) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const [passedTodayCount, lastPassedAttempt, publicPaths, progress] =
      await Promise.all([
        this.prisma.attempt.count({
          where: { userId, passed: true, createdAt: { gte: startOfDay } },
        }),
        this.prisma.attempt.findFirst({
          where: { userId, passed: true },
          orderBy: { createdAt: 'desc' },
          include: { subConcept: { select: { title: true, slug: true } } },
        }),
        this.listPublic(),
        this.getProgress(userId),
      ]);

    const defaultPathId = publicPaths[0]?.id ?? null;
    const defaultProgress = defaultPathId
      ? (progress.find((p) => p.id === defaultPathId) ?? null)
      : null;

    return {
      passedToday: passedTodayCount > 0,
      lastPassed: lastPassedAttempt
        ? {
            title: lastPassedAttempt.subConcept.title,
            slug: lastPassedAttempt.subConcept.slug,
            contentId: lastPassedAttempt.contentId,
          }
        : null,
      next:
        defaultProgress?.nextSlug && defaultProgress.nextContentId
          ? {
              title: defaultProgress.nextTitle,
              slug: defaultProgress.nextSlug,
              contentId: defaultProgress.nextContentId,
            }
          : null,
    };
  }

  private async assertOwnership(pathId: string, userId: string): Promise<void> {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      select: { userId: true },
    });
    if (!path) {
      throw new NotFoundException('Path not found');
    }
    if (path.userId !== userId) {
      throw new ForbiddenException('Not your path');
    }
  }
}
