import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddContentDto } from './dto/add-content.dto';
import { RecordWatchEventDto } from './dto/record-watch-event.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class SubConceptsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFirst() {
    const subConcept = await this.prisma.subConcept.findFirst({
      orderBy: [
        { concept: { theme: { subject: { order: 'asc' } } } },
        { concept: { theme: { order: 'asc' } } },
        { concept: { order: 'asc' } },
        { order: 'asc' },
      ],
      include: { contents: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }], take: 1, select: { id: true } } },
    });
    if (!subConcept) return null;
    return { slug: subConcept.slug, contentId: subConcept.contents[0]?.id ?? null };
  }

  // Full Subject -> Theme -> Concept -> SubConcept structure for the "add
  // content" picker. Unlike the path-builder's tree (paths/tree, which stops
  // at Concept per readme 2.2), this goes one level deeper since a Teacher is
  // targeting a specific Sub-concept slot, not assembling a path.
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
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    _count: { select: { contents: true } },
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
    });

    return subjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      slug: subject.slug,
      themes: subject.themes.map((theme) => ({
        id: theme.id,
        title: theme.title,
        concepts: theme.concepts.map((concept) => ({
          id: concept.id,
          title: concept.title,
          subConcepts: concept.subConcepts.map((subConcept) => ({
            id: subConcept.id,
            title: subConcept.title,
            slug: subConcept.slug,
            contentCount: subConcept._count.contents,
            primaryContentId: subConcept.contents[0]?.id ?? null,
          })),
        })),
      })),
    }));
  }

  // Route params for a Sub-concept accept either its raw id or its slug —
  // the /learn URL is slug-based, but internal callers (e.g. the add-content
  // picker, which already has ids from getTree) can keep passing ids.
  private async resolveSubConceptId(idOrSlug: string): Promise<string> {
    const subConcept = await this.prisma.subConcept.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });
    if (!subConcept) {
      throw new NotFoundException('Sub-concept not found');
    }
    return subConcept.id;
  }

  // The only content-creation capability a Teacher has: contribute a bundle
  // (video + optional preview/description/tasks) to an EXISTING Sub-concept
  // slot. Does not create/modify the tree itself. Recording the real
  // submitting user as creatorId (not just their typed creatorName) is what
  // lets a learner message the actual teacher from /learn.
  async addContent(subConceptIdOrSlug: string, user: User, dto: AddContentDto) {
    const subConceptId = await this.resolveSubConceptId(subConceptIdOrSlug);

    // A teacher must categorize BOTH pools whenever tasks are submitted at
    // all — rolling needs a homework task to start on and a solved-on-screen
    // task to roll into, so a content bundle with only one pool would make
    // the roll flow structurally unusable for this content.
    if (dto.tasks && dto.tasks.length > 0) {
      const hasHomework = dto.tasks.some((task) => !task.isSolvedOnScreen);
      const hasSolvedOnScreen = dto.tasks.some((task) => task.isSolvedOnScreen);
      if (!hasHomework || !hasSolvedOnScreen) {
        throw new BadRequestException(
          'Provide at least one homework task and one "solved on-screen" task so rolling works in both directions.',
        );
      }
    }

    const existingCount = await this.prisma.subConceptContent.count({ where: { subConceptId } });

    return this.prisma.subConceptContent.create({
      data: {
        subConceptId,
        video: dto.video,
        previewVideo: dto.previewVideo,
        description: dto.description,
        creatorName: dto.creatorName ?? user.displayName ?? user.email,
        creatorId: user.id,
        isPrimary: existingCount === 0,
        tasks: dto.tasks
          ? {
              create: dto.tasks.map((task) => ({
                type: task.type,
                prompt: task.prompt,
                choices: task.choices as Prisma.InputJsonValue | undefined,
                answer: task.answer as Prisma.InputJsonValue,
                isSolvedOnScreen: task.isSolvedOnScreen ?? false,
              })),
            }
          : undefined,
      },
      include: { tasks: true },
    });
  }

  async getDetail(subConceptIdOrSlug: string, userId: string) {
    const subConcept = await this.prisma.subConcept.findFirst({
      where: { OR: [{ id: subConceptIdOrSlug }, { slug: subConceptIdOrSlug }] },
      include: {
        contents: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 1,
          include: { tasks: { orderBy: { createdAt: 'asc' } } },
        },
        concept: { include: { theme: { include: { subject: true } } } },
      },
    });

    if (!subConcept) {
      throw new NotFoundException('Sub-concept not found');
    }

    const [content] = subConcept.contents;

    return {
      id: subConcept.id,
      slug: subConcept.slug,
      title: subConcept.title,
      breadcrumb: {
        subject: subConcept.concept.theme.subject.title,
        theme: subConcept.concept.theme.title,
        concept: subConcept.concept.title,
      },
      content: content ? this.toContentDto(content) : null,
    };
  }

  // Same as getDetail, but for a SPECIFIC content bundle rather than always
  // the primary one — this is what /learn/[slug]/[contentId] loads, so a
  // particular teacher's explanation is directly linkable/bookmarkable.
  // Also carries sibling Sub-concepts (same Concept) and a content count, so
  // the client can render a sidebar of "what else is in this Concept" and an
  // "N other explanations available" hint without extra round-trips.
  async getContentDetail(subConceptIdOrSlug: string, contentId: string, userId: string) {
    const subConcept = await this.prisma.subConcept.findFirst({
      where: { OR: [{ id: subConceptIdOrSlug }, { slug: subConceptIdOrSlug }] },
      include: {
        concept: {
          include: {
            theme: { include: { subject: true } },
            subConcepts: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                contents: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }], take: 1, select: { id: true } },
              },
            },
          },
        },
      },
    });
    if (!subConcept) {
      throw new NotFoundException('Sub-concept not found');
    }

    const siblingIds = subConcept.concept.subConcepts.map((sc) => sc.id);

    const [content, contentCount, masteredAttempts] = await Promise.all([
      this.prisma.subConceptContent.findFirst({
        where: { id: contentId, subConceptId: subConcept.id },
        include: { tasks: { orderBy: { createdAt: 'asc' } }, creator: { select: { photoUrl: true } } },
      }),
      this.prisma.subConceptContent.count({ where: { subConceptId: subConcept.id } }),
      // "Mastered" = at least one passed Attempt, scoped to this Concept's own
      // Sub-concepts (matches the sibling list shown alongside it).
      this.prisma.attempt.findMany({
        where: { userId, subConceptId: { in: siblingIds }, passed: true },
        select: { subConceptId: true },
        distinct: ['subConceptId'],
      }),
    ]);
    if (!content) {
      throw new NotFoundException('Content not found for this sub-concept');
    }

    return {
      id: subConcept.id,
      slug: subConcept.slug,
      title: subConcept.title,
      breadcrumb: {
        subject: subConcept.concept.theme.subject.title,
        theme: subConcept.concept.theme.title,
        concept: subConcept.concept.title,
      },
      content: { ...this.toContentDto(content), creatorPhotoUrl: content.creator?.photoUrl ?? null },
      contentCount,
      masteredCount: masteredAttempts.length,
      siblings: subConcept.concept.subConcepts.map((sc) => ({
        id: sc.id,
        slug: sc.slug,
        title: sc.title,
        contentId: sc.contents[0]?.id ?? null,
      })),
    };
  }

  async submitAttempt(subConceptIdOrSlug: string, userId: string, dto: SubmitAttemptDto) {
    const subConceptId = await this.resolveSubConceptId(subConceptIdOrSlug);

    // Grades the SPECIFIC task shown (a content can have several video
    // tasks now that the Test step can roll between them) — not just
    // whichever task happens to be first for this content.
    const test = await this.prisma.test.findFirst({ where: { id: dto.taskId, contentId: dto.contentId } });
    if (!test) {
      throw new NotFoundException('Task not found for this content');
    }

    const passed = JSON.stringify(dto.answer) === JSON.stringify(test.answer);

    const attempt = await this.prisma.attempt.create({
      data: { userId, subConceptId, contentId: dto.contentId, passed },
    });

    return { attemptId: attempt.id, passed };
  }

  // Powers the Test step's roll in both directions:
  // - pool='solvedOnScreen': a learner stuck on their HW task rolls into a
  //   task actually solved in the video, so there's a guaranteed answer to
  //   go check.
  // - pool='homework': from a solved-on-screen task, roll back to a FRESH
  //   HW task (exclude the one that originally stumped them) for a real
  //   second attempt, not a repeat of the same question.
  async getRandomTask(
    subConceptIdOrSlug: string,
    contentId: string,
    pool: 'solvedOnScreen' | 'homework',
    excludeTaskId?: string,
  ) {
    const subConceptId = await this.resolveSubConceptId(subConceptIdOrSlug);

    const content = await this.prisma.subConceptContent.findFirst({
      where: { id: contentId, subConceptId },
      select: { id: true },
    });
    if (!content) {
      throw new NotFoundException('Content not found for this sub-concept');
    }

    const candidates = await this.prisma.test.findMany({
      where: { contentId, isSolvedOnScreen: pool === 'solvedOnScreen' },
      orderBy: { createdAt: 'asc' },
    });
    if (candidates.length === 0) {
      throw new NotFoundException(pool === 'solvedOnScreen' ? 'No solved-on-screen tasks for this content' : 'No homework tasks for this content');
    }

    const eligible = excludeTaskId && candidates.length > 1 ? candidates.filter((t) => t.id !== excludeTaskId) : candidates;
    const chosen = eligible[Math.floor(Math.random() * eligible.length)];

    return {
      id: chosen.id,
      type: chosen.type,
      prompt: chosen.prompt,
      choices: chosen.choices,
      isSolvedOnScreen: chosen.isSolvedOnScreen,
      poolSize: candidates.length,
    };
  }

  // The first "Another Explanation" for a Sub-concept is free — a learner
  // shouldn't have to solve anything just to see whether a different
  // explanation clicks better. Every request after that first one is gated
  // behind having submitted the practice question at least once, same as
  // the original rule.
  async getAlternative(subConceptIdOrSlug: string, currentContentId: string, userId: string) {
    const subConceptId = await this.resolveSubConceptId(subConceptIdOrSlug);

    const lastAttempt = await this.prisma.attempt.findFirst({
      where: { userId, subConceptId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastAttempt) {
      // Server-side gate for the free-skip allowance — the client also
      // avoids calling this until it's needed, but this is the enforcement
      // that actually matters. AlternativeGrant is created (not just
      // checked) atomically via its unique constraint: a second concurrent
      // "free" request for the same user+subConcept loses the race here.
      try {
        await this.prisma.alternativeGrant.create({ data: { userId, subConceptId } });
      } catch {
        throw new ForbiddenException('Submit the practice question first');
      }
    }

    const alternative = await this.prisma.subConceptContent.findFirst({
      where: { subConceptId, id: { not: currentContentId } },
      orderBy: { createdAt: 'asc' },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });

    if (!alternative) {
      throw new NotFoundException('No alternative explanation available yet');
    }

    if (lastAttempt) {
      await this.prisma.attempt.update({
        where: { id: lastAttempt.id },
        data: { requestedAlt: true },
      });
    }

    return this.toContentDto(alternative);
  }

  async getNext(subConceptIdOrSlug: string) {
    const subConceptId = await this.resolveSubConceptId(subConceptIdOrSlug);
    const current = await this.prisma.subConcept.findUnique({
      where: { id: subConceptId },
      include: { concept: true },
    });
    if (!current) {
      throw new NotFoundException('Sub-concept not found');
    }

    const primaryContent = (subConcept: { id: string }) =>
      this.prisma.subConceptContent.findFirst({
        where: { subConceptId: subConcept.id },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: { id: true },
      });

    const nextSibling = await this.prisma.subConcept.findFirst({
      where: { conceptId: current.conceptId, order: { gt: current.order } },
      orderBy: { order: 'asc' },
    });
    if (nextSibling) {
      const content = await primaryContent(nextSibling);
      return { slug: nextSibling.slug, contentId: content?.id ?? null };
    }

    const nextConcept = await this.prisma.concept.findFirst({
      where: { themeId: current.concept.themeId, order: { gt: current.concept.order } },
      orderBy: { order: 'asc' },
      include: { subConcepts: { orderBy: { order: 'asc' }, take: 1 } },
    });

    const nextSubConcept = nextConcept?.subConcepts[0];
    if (!nextSubConcept) return null;
    const content = await primaryContent(nextSubConcept);
    return { slug: nextSubConcept.slug, contentId: content?.id ?? null };
  }

  async recordWatchEvent(userId: string, dto: RecordWatchEventDto): Promise<void> {
    await this.prisma.watchEvent.create({
      data: {
        userId,
        contentId: dto.contentId,
        watchedSeconds: dto.watchedSeconds,
        completed: dto.completed,
      },
    });
  }

  private toContentDto(content: {
    id: string;
    video: string;
    previewVideo: string | null;
    description: string | null;
    creatorName: string | null;
    creatorId: string | null;
    tasks: { id: string; type: string; prompt: string; choices: unknown; isSolvedOnScreen: boolean }[];
  }) {
    // The Test step always STARTS on an HW task — solved-on-screen ones are
    // never the initial task, only reachable by rolling when stuck.
    const hwTasks = content.tasks.filter((t) => !t.isSolvedOnScreen);
    const solvedOnScreenCount = content.tasks.length - hwTasks.length;
    const [test] = hwTasks;
    return {
      id: content.id,
      video: content.video,
      previewVideo: content.previewVideo,
      description: content.description,
      creatorName: content.creatorName,
      creatorId: content.creatorId,
      // `answer` is intentionally omitted — grading happens server-side in submitAttempt.
      test: test ? { id: test.id, type: test.type, prompt: test.prompt, choices: test.choices } : null,
      solvedOnScreenCount,
    };
  }
}
