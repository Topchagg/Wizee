import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { PrismaService } from '../prisma/prisma.service';

// Any authenticated user can propose a child node; only SUPERADMIN ever sees
// the list (see SuggestionsController) — the tree itself stays curator-only
// (AdminService), this is just a request queue in front of it. Approving a
// suggestion reuses AdminService's own create methods, so an approved
// suggestion goes through exactly the same path/SearchTable sync as a direct
// admin create.
@Injectable()
export class SuggestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly admin: AdminService,
  ) {}

  async suggestTheme(subjectId: string, title: string, suggestedById: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return this.prisma.suggestion.create({
      data: { type: 'THEME', title, subjectId, suggestedById },
    });
  }

  async suggestConcept(themeId: string, title: string, suggestedById: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
      select: { id: true },
    });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    return this.prisma.suggestion.create({
      data: { type: 'CONCEPT', title, themeId, suggestedById },
    });
  }

  async suggestSubConcept(
    conceptId: string,
    title: string,
    suggestedById: string,
  ) {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      select: { id: true },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    return this.prisma.suggestion.create({
      data: { type: 'SUBCONCEPT', title, conceptId, suggestedById },
    });
  }

  // Denormalized parent-chain titles, same reasoning as SearchTable — lets
  // the admin list show "Theme X → suggested Concept" in one query instead
  // of the client stitching together three separate lookups.
  list() {
    return this.prisma.suggestion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { title: true } },
        theme: {
          select: { title: true, subject: { select: { title: true } } },
        },
        concept: {
          select: {
            title: true,
            theme: {
              select: { title: true, subject: { select: { title: true } } },
            },
          },
        },
        suggestedBy: { select: { displayName: true, email: true } },
      },
    });
  }

  async approve(id: string) {
    const suggestion = await this.prisma.suggestion.findUnique({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (suggestion.type === 'THEME') {
      await this.admin.createTheme(suggestion.subjectId!, suggestion.title);
    } else if (suggestion.type === 'CONCEPT') {
      await this.admin.createConcept(suggestion.themeId!, suggestion.title);
    } else {
      await this.admin.createSubConcept(
        suggestion.conceptId!,
        suggestion.title,
      );
    }

    await this.prisma.suggestion.delete({ where: { id } });
  }

  async reject(id: string) {
    const suggestion = await this.prisma.suggestion.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }
    await this.prisma.suggestion.delete({ where: { id } });
  }
}
