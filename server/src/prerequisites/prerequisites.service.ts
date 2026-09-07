import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PrerequisiteConcept = {
  id: string;
  title: string;
  themeTitle: string;
};

// Prerequisite links exist ONLY between Concepts — never Sub-concepts (too
// granular, would produce thousands of edges) and never Themes (too coarse,
// a whole Theme is never really "prerequisite" to another). A Concept has
// exactly one canonical Theme (Concept.themeId) plus zero or more
// prerequisite Concepts, which may live in any Theme — see ConceptPrerequisite
// in schema.prisma. Cross-Theme relevance is expressed only through this
// edge, never through a second "membership".
@Injectable()
export class PrerequisitesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(conceptId: string, requiresConceptId: string) {
    if (conceptId === requiresConceptId) {
      throw new BadRequestException('A Concept cannot be its own prerequisite');
    }

    const [concept, requires] = await Promise.all([
      this.prisma.concept.findUnique({
        where: { id: conceptId },
        select: { id: true },
      }),
      this.prisma.concept.findUnique({
        where: { id: requiresConceptId },
        select: { id: true },
      }),
    ]);
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    if (!requires) {
      throw new NotFoundException('Prerequisite Concept not found');
    }

    // prerequisite_ids is a set, not an ordered list with possible repeats —
    // re-adding an existing edge is a no-op, not an error.
    const existing = await this.prisma.conceptPrerequisite.findUnique({
      where: { conceptId_requiresConceptId: { conceptId, requiresConceptId } },
    });
    if (existing) {
      return existing;
    }

    if (await this.wouldCreateCycle(conceptId, requiresConceptId)) {
      throw new BadRequestException(
        'That would create a prerequisite cycle — a Concept can never (even transitively) require itself',
      );
    }

    return this.prisma.conceptPrerequisite.create({
      data: { conceptId, requiresConceptId },
    });
  }

  async remove(conceptId: string, requiresConceptId: string): Promise<void> {
    await this.prisma.conceptPrerequisite.deleteMany({
      where: { conceptId, requiresConceptId },
    });
  }

  async listDirect(conceptId: string): Promise<PrerequisiteConcept[]> {
    const rows = await this.prisma.conceptPrerequisite.findMany({
      where: { conceptId },
      include: {
        requires: {
          select: { id: true, title: true, theme: { select: { title: true } } },
        },
      },
    });
    return rows.map((row) => ({
      id: row.requires.id,
      title: row.requires.title,
      themeTitle: row.requires.theme.title,
    }));
  }

  // Reverse lookup — every Concept that lists `conceptId` as a prerequisite.
  // Needed before an architect/moderator edits or removes a Concept, so they
  // can see what depends on it first.
  async listDependents(conceptId: string): Promise<PrerequisiteConcept[]> {
    const rows = await this.prisma.conceptPrerequisite.findMany({
      where: { requiresConceptId: conceptId },
      include: {
        concept: {
          select: { id: true, title: true, theme: { select: { title: true } } },
        },
      },
    });
    return rows.map((row) => ({
      id: row.concept.id,
      title: row.concept.title,
      themeTitle: row.concept.theme.title,
    }));
  }

  // The full prerequisite chain, not just direct parents — BFS over `requires`
  // edges, nearest first, each Concept id appearing once even if reachable
  // through more than one path. Used by the Path builder's "add this too?"
  // suggestion and by the public Path list's completeness signal.
  async listTransitive(conceptId: string): Promise<PrerequisiteConcept[]> {
    const visited = new Set<string>([conceptId]);
    const orderedIds: string[] = [];
    let frontier = [conceptId];

    while (frontier.length > 0) {
      const edges = await this.prisma.conceptPrerequisite.findMany({
        where: { conceptId: { in: frontier } },
        select: { requiresConceptId: true },
      });
      const nextFrontier: string[] = [];
      for (const edge of edges) {
        if (!visited.has(edge.requiresConceptId)) {
          visited.add(edge.requiresConceptId);
          orderedIds.push(edge.requiresConceptId);
          nextFrontier.push(edge.requiresConceptId);
        }
      }
      frontier = nextFrontier;
    }

    if (orderedIds.length === 0) {
      return [];
    }
    const concepts = await this.prisma.concept.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true, title: true, theme: { select: { title: true } } },
    });
    const byId = new Map(concepts.map((c) => [c.id, c]));
    return orderedIds.map((id) => {
      const c = byId.get(id)!;
      return { id: c.id, title: c.title, themeTitle: c.theme.title };
    });
  }

  // Would adding the edge "conceptId requires requiresConceptId" create a
  // cycle? True iff requiresConceptId can already (transitively) reach
  // conceptId via EXISTING requires edges — i.e. requiresConceptId already
  // depends, directly or indirectly, on conceptId.
  private async wouldCreateCycle(
    conceptId: string,
    requiresConceptId: string,
  ): Promise<boolean> {
    const visited = new Set<string>([requiresConceptId]);
    const queue = [requiresConceptId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === conceptId) {
        return true;
      }
      const edges = await this.prisma.conceptPrerequisite.findMany({
        where: { conceptId: current },
        select: { requiresConceptId: true },
      });
      for (const edge of edges) {
        if (!visited.has(edge.requiresConceptId)) {
          visited.add(edge.requiresConceptId);
          queue.push(edge.requiresConceptId);
        }
      }
    }
    return false;
  }
}
