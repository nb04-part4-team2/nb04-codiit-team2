import prisma from '../src/config/prisma.js';

console.log('Integration Test Setup');

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

beforeEach(async () => {
  // 각 테스트 전 모든 테이블 초기화
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableNames.join(', ')} RESTART IDENTITY CASCADE;`,
  );
  console.log('✨ DB 초기화 완료!');
});

afterAll(async () => {
  await prisma.$disconnect();
});
