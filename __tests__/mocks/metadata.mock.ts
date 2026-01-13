import { Grade } from '@prisma/client';

export const createGradeMock = (): Grade[] => [
  {
    id: 'grade_vip',
    name: 'vip',
    minAmount: 1000000,
    rate: 0.1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'grade_black',
    name: 'black',
    minAmount: 500000,
    rate: 0.07,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'grade_red',
    name: 'red',
    minAmount: 300000,
    rate: 0.05,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'grade_orange',
    name: 'orange',
    minAmount: 100000,
    rate: 0.03,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'grade_green',
    name: 'green',
    minAmount: 0,
    rate: 0.01,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
