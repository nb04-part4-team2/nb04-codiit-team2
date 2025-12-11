import { jest } from '@jest/globals';
import prisma from '../src/config/prisma.js';

// 테이블 TRUNCATE 순서 (FK 의존성 고려)
const tableNames = [
  'notifications',
  'point_history',
  'store_likes',
  'replies',
  'inquiries',
  'reviews',
  'payments',
  'order_items',
  'orders',
  'cart_items',
  'carts',
  'stocks',
  'products',
  'categories',
  'stores',
  'users',
  'grade',
  'size',
];

// 테스트 중 console 출력 억제 (디버깅 시 주석 처리)
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

beforeEach(async () => {
  // 각 테스트 전 모든 테이블 초기화
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableNames.join(', ')} RESTART IDENTITY CASCADE;`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
  // console 복원
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});
