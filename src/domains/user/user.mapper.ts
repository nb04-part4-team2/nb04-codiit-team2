import type { UserResponseDto, UserWithGrade, StoreLikeResponseDto } from './user.dto.js';
import type { StoreLike, Store } from '@prisma/client';

/**
 * UserWithGrade → UserResponseDto 변환 매퍼
 * 서비스/컨트롤러의 응답 일관성을 유지하기 위해 사용
 */
export const toUserResponse = (user: UserWithGrade): UserResponseDto => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    points: user.point,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    image: user.image,
    grade: {
      id: user.grade.id,
      name: user.grade.name,
      rate: user.grade.rate * 100,
      minAmount: user.grade.minAmount,
    },
  };
};

/**
 * StoreLike → StoreLikeResponseDto 변환 매퍼
 * 좋아요한 스토어 목록 응답을 담당
 */
export const toStoreLikeResponse = (like: StoreLike & { store: Store }): StoreLikeResponseDto => {
  return {
    store: {
      id: like.store.id,
      userId: like.store.userId,
      name: like.store.name,
      address: like.store.address,
      phoneNumber: like.store.phoneNumber,
      content: like.store.content,
      image: like.store.image,
      createdAt: like.store.createdAt,
      updatedAt: like.store.updatedAt,
      detailAddress: like.store.detailAddress,
    },
  };
};
