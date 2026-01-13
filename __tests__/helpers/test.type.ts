import type { Prisma } from '@prisma/client';

// 트랜잭션 타입 정의
export type TxMock = <T>(cb: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>;
