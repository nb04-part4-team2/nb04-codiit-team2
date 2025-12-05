import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const grades = [
    { id: 'grade_vip', name: 'vip', minAmount: 1000000, rate: 0.1 },
    { id: 'grade_black', name: 'black', minAmount: 500000, rate: 0.07 },
    { id: 'grade_red', name: 'red', minAmount: 300000, rate: 0.05 },
    { id: 'grade_orange', name: 'orange', minAmount: 100000, rate: 0.03 },
    { id: 'grade_green', name: 'green', minAmount: 0, rate: 0.01 },
  ];

  for (const grade of grades) {
    await prisma.grade.upsert({
      where: { id: grade.id },
      update: {},
      create: grade,
    });
  }

  console.log('✅ Grade 시드 데이터 완료');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
