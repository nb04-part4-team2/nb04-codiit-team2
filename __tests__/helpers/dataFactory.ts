import prisma from '@/config/prisma.js';
import bcrypt from 'bcrypt';
import type { Grade, User, Store, Category, Product } from '@prisma/client';

// ============================================
// 상수
// ============================================
export const TEST_PASSWORD = 'test1234';

// ============================================
// Grade (User 생성에 필요)
// ============================================
interface CreateGradeOptions {
  name?: string;
  minAmount?: number;
  rate?: number;
}

export const createTestGrade = async (overrides: CreateGradeOptions = {}): Promise<Grade> => {
  return prisma.grade.create({
    data: {
      name: overrides.name ?? '브론즈',
      minAmount: overrides.minAmount ?? 0,
      rate: overrides.rate ?? 0.01,
    },
  });
};

// ============================================
// User
// ============================================
interface CreateUserOptions {
  email?: string;
  password?: string;
  name?: string;
  type?: 'BUYER' | 'SELLER';
  gradeId: string;
}

export const createTestUser = async (options: CreateUserOptions): Promise<User> => {
  const timestamp = Date.now();
  const hashedPassword = await bcrypt.hash(options.password ?? TEST_PASSWORD, 10);

  return prisma.user.create({
    data: {
      email: options.email ?? `test-${timestamp}@example.com`,
      password: hashedPassword,
      name: options.name ?? `테스트유저${timestamp}`,
      type: options.type ?? 'BUYER',
      gradeId: options.gradeId,
    },
  });
};

// ============================================
// 편의 함수: Seller 생성
// ============================================
export const createTestSeller = async (
  gradeId: string,
  overrides: Partial<CreateUserOptions> = {},
): Promise<User> => {
  return createTestUser({
    gradeId,
    type: 'SELLER',
    email: overrides.email ?? `seller-${Date.now()}@test.com`,
    name: overrides.name ?? '테스트 판매자',
    password: overrides.password,
  });
};

// ============================================
// 편의 함수: Buyer 생성
// ============================================
export const createTestBuyer = async (
  gradeId: string,
  overrides: Partial<CreateUserOptions> = {},
): Promise<User> => {
  return createTestUser({
    gradeId,
    type: 'BUYER',
    email: overrides.email ?? `buyer-${Date.now()}@test.com`,
    name: overrides.name ?? '테스트 구매자',
    password: overrides.password,
  });
};

// ============================================
// Store (판매자 전용)
// ============================================
interface CreateStoreOptions {
  name?: string;
  address?: string;
  phoneNumber?: string;
  content?: string;
}

export const createTestStore = async (
  userId: string,
  overrides: CreateStoreOptions = {},
): Promise<Store> => {
  return prisma.store.create({
    data: {
      name: overrides.name ?? '테스트 스토어',
      address: overrides.address ?? '서울시 강남구',
      phoneNumber: overrides.phoneNumber ?? '010-1234-5678',
      content: overrides.content ?? '테스트 스토어 설명입니다.',
      userId,
    },
  });
};

// ============================================
// Category
// ============================================
export const createTestCategory = async (name = '상의'): Promise<Category> => {
  return prisma.category.create({
    data: { name },
  });
};

// ============================================
// Product
// ============================================
interface CreateProductOptions {
  storeId: string;
  categoryId: string;
  name?: string;
  price?: number;
  image?: string;
}

export const createTestProduct = async (options: CreateProductOptions): Promise<Product> => {
  return prisma.product.create({
    data: {
      name: options.name ?? '테스트 상품',
      price: options.price ?? 10000,
      image: options.image ?? 'https://example.com/image.jpg',
      storeId: options.storeId,
      categoryId: options.categoryId,
    },
  });
};

// ============================================
// 복합 데이터 생성: 기본 테스트 환경 (Grade + Seller + Buyer)
// ============================================
export interface TestContext {
  grade: Grade;
  seller: User;
  buyer: User;
}

export const createTestContext = async (): Promise<TestContext> => {
  const grade = await createTestGrade();
  const seller = await createTestSeller(grade.id);
  const buyer = await createTestBuyer(grade.id);

  return { grade, seller, buyer };
};

// ============================================
// 복합 데이터 생성: 판매자 + 스토어 + 상품
// ============================================
export interface SellerWithProductContext extends TestContext {
  store: Store;
  category: Category;
  product: Product;
}

export const createSellerWithProduct = async (): Promise<SellerWithProductContext> => {
  const { grade, seller, buyer } = await createTestContext();
  const store = await createTestStore(seller.id);
  const category = await createTestCategory();
  const product = await createTestProduct({
    storeId: store.id,
    categoryId: category.id,
  });

  return { grade, seller, buyer, store, category, product };
};
