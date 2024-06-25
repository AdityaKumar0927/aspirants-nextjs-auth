import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(process.cwd(), 'public', 'questions.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const questions = JSON.parse(fileContents);

  for (const question of questions) {
    await prisma.question.create({
      data: {
        text: question.text,
        subject: question.subject,
        difficulty: question.difficulty,
        type: question.type,
        year: question.year,
        options: question.options,
        correctOption: question.correctOption,
        markscheme: question.markscheme,
      },
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
