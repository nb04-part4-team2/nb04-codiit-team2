console.log('Test Setup');
// import { config } from 'dotenv';
// import { dirname, resolve } from 'path';
// import prisma from '../src/config/prisma';
// import { fileURLToPath } from 'url';
// import { beforeEach, afterAll } from '@jest/globals';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// config({ path: resolve(__dirname, '../.env.test'), override: true });

// // beforeAll(async () => {
// //   await connectToRedis();
// // });

// beforeEach(async () => {
//   console.log('🧹 DB 초기화 시작...');
//   //   await redisClient.flushAll();
//   const tableNames = [
//     'notifications',
//     'point_history',
//     'store_likes',
//     'replies',
//     'inquiries',
//     'reviews',
//     'payments',
//     'order_items',
//     'orders',
//     'cart_items',
//     'carts',
//     'stocks',
//     'products',
//     'categories',
//     'stores',
//     'users',
//     'grade',
//     'size',
//   ];
//   await prisma.$executeRawUnsafe(
//     `TRUNCATE TABLE ${tableNames.join(', ')} RESTART IDENTITY CASCADE;`,
//   );
//   console.log('✨ DB 초기화 완료!');
// });

// afterAll(async () => {
//   await prisma.$disconnect();
//   //   await redisClient.flushAll();
//   //   await redisClient.quit();
// });
