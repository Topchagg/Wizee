import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Placeholder tree/videos to exercise the learn loop end-to-end during
// development. Not real curriculum content — see readme MVP Step 1.
const SAMPLE_VIDEO_A = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const SAMPLE_VIDEO_B = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// One video + one task per Sub-concept. The quiz is intentionally
// topic-agnostic ("the concept explained in this video") rather than a
// hand-written fact per Sub-concept — at 192 of these, a wrong hand-written
// "correct answer" is a bigger risk than a generic-but-always-correct one.
// `withAlternative` adds a second (non-primary) content bundle so a handful
// of Sub-concepts can still exercise the "Another Explanation" flow.
function genSubConcept(order: number, title: string, withAlternative = false): Prisma.SubConceptCreateWithoutConceptInput {
  const task: Prisma.TestCreateWithoutContentInput = {
    type: 'MULTIPLE_CHOICE',
    prompt: `In this lesson, "${title}" is best understood as:`,
    choices: [
      'The concept explained in this video',
      'An unrelated topic',
      'A historical footnote',
      'A more advanced follow-up topic',
    ],
    answer: 'The concept explained in this video',
  };
  // Every content bundle needs a homework task (the Test step's default) AND
  // a solved-on-screen one to roll into — a plain duplicate is honest here
  // since the placeholder quiz above is already topic-agnostic.
  const solvedOnScreenTask: Prisma.TestCreateWithoutContentInput = { ...task, isSolvedOnScreen: true };

  return {
    title,
    slug: slugify(title),
    order,
    contents: {
      create: [
        {
          video: SAMPLE_VIDEO_A,
          previewVideo: SAMPLE_VIDEO_B,
          description: `A short introduction to ${title.toLowerCase()}.`,
          creatorName: 'Wizee Team',
          isPrimary: true,
          tasks: { create: [task, solvedOnScreenTask] },
        },
        ...(withAlternative
          ? [
              {
                video: SAMPLE_VIDEO_B,
                previewVideo: SAMPLE_VIDEO_A,
                creatorName: 'Wizee Team (alt)',
                isPrimary: false,
                tasks: { create: [task, solvedOnScreenTask] },
              },
            ]
          : []),
      ],
    },
  };
}

type ConceptSeed = { title: string; subConcepts: string[] };
type ThemeSeed = { title: string; concepts: ConceptSeed[] };
type SubjectSeed = { title: string; themes: ThemeSeed[] };

const SUBJECTS: SubjectSeed[] = [
  {
    title: 'Mathematics',
    themes: [
      {
        title: 'Linear Algebra',
        concepts: [
          { title: 'Vectors', subConcepts: ['What is a vector', 'Vector addition', 'Dot product', 'Cross product'] },
          { title: 'Matrices', subConcepts: ['Matrix multiplication', 'Matrix addition', 'Matrix transpose', 'Matrix inverse'] },
          {
            title: 'Eigenvalues & Eigenvectors',
            subConcepts: ['What is an eigenvalue', 'What is an eigenvector', 'Characteristic polynomial', 'Diagonalization'],
          },
          {
            title: 'Vector Spaces',
            subConcepts: ['Basis and dimension', 'Linear independence', 'Span of vectors', 'Subspaces'],
          },
        ],
      },
      {
        title: 'Calculus',
        concepts: [
          { title: 'Limits', subConcepts: ['What is a limit', 'One-sided limits', 'Limits at infinity', 'Continuity'] },
          { title: 'Derivatives', subConcepts: ['What is a derivative', 'The power rule', 'The chain rule', 'The product rule'] },
          {
            title: 'Integrals',
            subConcepts: [
              'What is an integral',
              'The fundamental theorem of calculus',
              'Definite vs indefinite integrals',
              'Integration by substitution',
            ],
          },
          { title: 'Series', subConcepts: ['What is a sequence', 'What is a series', 'Geometric series', 'Convergence tests'] },
        ],
      },
      {
        title: 'Probability & Statistics',
        concepts: [
          {
            title: 'Probability Basics',
            subConcepts: ['What is probability', 'Independent events', 'Conditional probability', "Bayes' theorem"],
          },
          {
            title: 'Distributions',
            subConcepts: ['Normal distribution', 'Binomial distribution', 'Uniform distribution', 'Poisson distribution'],
          },
          { title: 'Expected Value', subConcepts: ['What is expected value', 'Variance', 'Standard deviation', 'Covariance'] },
          {
            title: 'Hypothesis Testing',
            subConcepts: ['Null vs alternative hypothesis', 'p-values', 'Confidence intervals', 'Type I and Type II errors'],
          },
        ],
      },
      {
        title: 'Discrete Math',
        concepts: [
          { title: 'Set Theory', subConcepts: ['What is a set', 'Set operations', 'Subsets and power sets', 'Venn diagrams'] },
          { title: 'Graph Theory', subConcepts: ['What is a graph', 'Directed vs undirected graphs', 'Graph traversal', 'Trees as graphs'] },
          { title: 'Combinatorics', subConcepts: ['Permutations', 'Combinations', 'The pigeonhole principle', 'Counting with repetition'] },
          { title: 'Logic', subConcepts: ['Propositional logic', 'Truth tables', 'Logical operators', 'Proof by induction'] },
        ],
      },
    ],
  },
  {
    title: 'Physics',
    themes: [
      {
        title: 'Mechanics',
        concepts: [
          { title: 'Kinematics', subConcepts: ['Position, velocity, and acceleration', 'Equations of motion', 'Free fall', 'Projectile motion'] },
          { title: "Newton's Laws", subConcepts: ["Newton's first law", "Newton's second law", "Newton's third law", 'Friction'] },
          { title: 'Energy & Work', subConcepts: ['What is work', 'Kinetic energy', 'Potential energy', 'Conservation of energy'] },
          { title: 'Momentum', subConcepts: ['What is momentum', 'Conservation of momentum', 'Elastic collisions', 'Inelastic collisions'] },
        ],
      },
      {
        title: 'Electromagnetism',
        concepts: [
          { title: 'Electric Charge', subConcepts: ['What is electric charge', "Coulomb's law", 'Electric field', 'Electric potential'] },
          { title: 'Electric Circuits', subConcepts: ["Ohm's law", 'Series circuits', 'Parallel circuits', "Kirchhoff's laws"] },
          { title: 'Magnetism', subConcepts: ['What is a magnetic field', 'Magnetic force on a charge', 'Right-hand rule', 'Electromagnets'] },
          {
            title: 'Electromagnetic Induction',
            subConcepts: ["Faraday's law", "Lenz's law", 'Induced EMF', 'Transformers'],
          },
        ],
      },
      {
        title: 'Thermodynamics',
        concepts: [
          { title: 'Temperature & Heat', subConcepts: ['What is temperature', 'Heat transfer', 'Specific heat capacity', 'Thermal equilibrium'] },
          { title: 'Laws of Thermodynamics', subConcepts: ['The zeroth law', 'The first law', 'The second law', 'The third law'] },
          { title: 'Gas Laws', subConcepts: ["Boyle's law", "Charles's law", 'The ideal gas law', "Avogadro's law"] },
          {
            title: 'Entropy',
            subConcepts: ['What is entropy', 'Entropy and disorder', 'Reversible vs irreversible processes', 'Entropy in the universe'],
          },
        ],
      },
      {
        title: 'Waves & Optics',
        concepts: [
          { title: 'Wave Basics', subConcepts: ['What is a wave', 'Wavelength and frequency', 'Transverse vs longitudinal waves', 'Wave interference'] },
          { title: 'Sound Waves', subConcepts: ['What is sound', 'The Doppler effect', 'Resonance', 'Decibels and loudness'] },
          { title: 'Light & Reflection', subConcepts: ['What is light', 'The law of reflection', 'Mirrors', 'Total internal reflection'] },
          { title: 'Refraction & Lenses', subConcepts: ['What is refraction', "Snell's law", 'Convex and concave lenses', 'How the eye focuses light'] },
        ],
      },
    ],
  },
  {
    title: 'Computer Science',
    themes: [
      {
        title: 'Programming Fundamentals',
        concepts: [
          { title: 'Variables & Types', subConcepts: ['What is a variable', 'Primitive data types', 'Type conversion', 'Constants'] },
          { title: 'Control Flow', subConcepts: ['If statements', 'For loops', 'While loops', 'Switch statements'] },
          { title: 'Functions', subConcepts: ['What is a function', 'Parameters and arguments', 'Return values', 'Recursion'] },
          {
            title: 'Object-Oriented Programming',
            subConcepts: ['Classes and objects', 'Inheritance', 'Encapsulation', 'Polymorphism'],
          },
        ],
      },
      {
        title: 'Data Structures',
        concepts: [
          { title: 'Arrays & Lists', subConcepts: ['What is an array', 'Linked lists', 'Array vs linked list', 'Dynamic arrays'] },
          { title: 'Stacks & Queues', subConcepts: ['What is a stack', 'What is a queue', 'LIFO vs FIFO', 'Using a stack for undo'] },
          { title: 'Trees', subConcepts: ['What is a tree', 'Binary trees', 'Binary search trees', 'Tree traversal'] },
          { title: 'Hash Tables', subConcepts: ['What is a hash table', 'Hash functions', 'Collision handling', 'Load factor'] },
        ],
      },
      {
        title: 'Algorithms',
        concepts: [
          { title: 'Sorting', subConcepts: ['Bubble sort', 'Insertion sort', 'Merge sort', 'Quick sort'] },
          { title: 'Searching', subConcepts: ['Linear search', 'Binary search', 'Depth-first search', 'Breadth-first search'] },
          {
            title: 'Recursion & Divide-and-Conquer',
            subConcepts: ['What is recursion', 'Base cases', 'Divide and conquer', 'Memoization'],
          },
          {
            title: 'Big O Notation',
            subConcepts: ['What is Big O', 'Time vs space complexity', 'Best, average, and worst case', 'Common complexity classes'],
          },
        ],
      },
      {
        title: 'Databases',
        concepts: [
          { title: 'Relational Model', subConcepts: ['What is a database', 'Tables, rows, and columns', 'Primary keys', 'Foreign keys'] },
          { title: 'SQL Basics', subConcepts: ['SELECT statements', 'WHERE clauses', 'JOIN operations', 'Insert, update, and delete'] },
          { title: 'Normalization', subConcepts: ['Why normalize', 'First normal form', 'Second normal form', 'Third normal form'] },
          { title: 'Indexing', subConcepts: ['What is an index', 'B-tree indexes', 'When to use an index', 'Index trade-offs'] },
        ],
      },
    ],
  },
];

async function main() {
  // SearchTable isn't a child of Subject via FK (idLink is polymorphic, not a
  // relation), so it doesn't cascade-delete with the subjects below — clear
  // it explicitly.
  await prisma.searchTable.deleteMany();
  await prisma.subject.deleteMany();

  const createdSubjects: Awaited<ReturnType<typeof createSubject>>[] = [];
  for (const [subjectIndex, subjectSeed] of SUBJECTS.entries()) {
    createdSubjects.push(await createSubject(subjectSeed, subjectIndex + 1));
  }

  await prisma.searchTable.createMany({ data: createdSubjects.flatMap(buildSearchRows) });

  console.log(`Seeded ${SUBJECTS.length} subjects, each with ${SUBJECTS[0].themes.length} themes.`);

  const mathematics = createdSubjects.find((s) => s.title === 'Mathematics')!;
  const linearAlgebra = mathematics.themes.find((t) => t.title === 'Linear Algebra')!;
  const vectors = linearAlgebra.concepts.find((c) => c.title === 'Vectors')!;
  const matrices = linearAlgebra.concepts.find((c) => c.title === 'Matrices')!;

  // Placeholder "other user" who built these paths — proves LearningPaths are
  // user-authored content, not something the app/admins generate.
  const communityCreator = await prisma.user.upsert({
    where: { firebaseUid: 'seed-community-creator' },
    update: {},
    create: {
      firebaseUid: 'seed-community-creator',
      email: 'community@wizee.dev',
      displayName: 'Wizee Community',
    },
  });
  await prisma.learningPath.deleteMany({ where: { userId: communityCreator.id } });

  await prisma.learningPath.create({
    data: {
      userId: communityCreator.id,
      title: 'Path to Enroll into Uni X — Faculty Y',
      isPublic: true,
      items: {
        create: [
          { order: 1, itemType: 'CONCEPT', conceptId: vectors.id },
          { order: 2, itemType: 'CONCEPT', conceptId: matrices.id },
        ],
      },
    },
  });

  await prisma.learningPath.create({
    data: {
      userId: communityCreator.id,
      title: 'Linear Algebra Crash Course',
      isPublic: true,
      items: {
        create: [{ order: 1, itemType: 'THEME', themeId: linearAlgebra.id }],
      },
    },
  });

  console.log('Seeded 2 public Learning Paths.');
}

function createSubject(subjectSeed: SubjectSeed, order: number) {
  return prisma.subject.create({
    data: {
      title: subjectSeed.title,
      slug: slugify(subjectSeed.title),
      order,
      themes: {
        create: subjectSeed.themes.map((themeSeed, themeIndex) => ({
          title: themeSeed.title,
          order: themeIndex + 1,
          concepts: {
            create: themeSeed.concepts.map((conceptSeed, conceptIndex) => ({
              title: conceptSeed.title,
              order: conceptIndex + 1,
              subConcepts: {
                // The very first Sub-concept of each Subject's first Theme/Concept
                // keeps a second content bundle, so "Another Explanation" stays
                // manually testable without adding content through the UI first.
                create: conceptSeed.subConcepts.map((title, subConceptIndex) =>
                  genSubConcept(
                    subConceptIndex + 1,
                    title,
                    themeIndex === 0 && conceptIndex === 0 && subConceptIndex === 0,
                  ),
                ),
              },
            })),
          },
        })),
      },
    },
    include: { themes: { include: { concepts: { include: { subConcepts: true } } } } },
  });
}

// One row per Theme/Concept/SubConcept, denormalized with the ancestor chain
// (see SearchTable's schema comment) so the path builder's search can offer
// the right "Add" target for a hit at any level in a single query.
function buildSearchRows(subject: Awaited<ReturnType<typeof createSubject>>): Prisma.SearchTableCreateManyInput[] {
  const rows: Prisma.SearchTableCreateManyInput[] = [];
  for (const theme of subject.themes) {
    rows.push({ name: theme.title, type: 'THEME', idLink: theme.id, subjectId: subject.id });
    for (const concept of theme.concepts) {
      rows.push({
        name: concept.title,
        type: 'CONCEPT',
        idLink: concept.id,
        subjectId: subject.id,
        themeId: theme.id,
        themeTitle: theme.title,
      });
      for (const subConcept of concept.subConcepts) {
        rows.push({
          name: subConcept.title,
          type: 'SUBCONCEPT',
          idLink: subConcept.id,
          subjectId: subject.id,
          themeId: theme.id,
          themeTitle: theme.title,
          conceptId: concept.id,
          conceptTitle: concept.title,
        });
      }
    }
  }
  return rows;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
