import { Grade } from '@prisma/client';

export const createGradeMock = (): Grade[] => [
  {
    id: 'grade_bronze',
    name: 'Bronze',
    minAmount: 0,
    rate: 0.01,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'grade_silver',
    name: 'Silver',
    minAmount: 100001,
    rate: 0.03,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'grade_gold',
    name: 'Gold',
    minAmount: 500001,
    rate: 0.05,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
