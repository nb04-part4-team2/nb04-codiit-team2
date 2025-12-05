import type { UserType } from '@prisma/client';

export interface GradeDto {
  id: string;
  name: string;
  rate: number;
  minAmount: number;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  type: UserType;
  point: number;
  createdAt: Date;
  updatedAt: Date;
  grade: GradeDto;
  image: string | null;
}

export interface UserWithGrade {
  id: string;
  name: string;
  email: string;
  type: UserType;
  point: number;
  createdAt: Date;
  updatedAt: Date;
  image: string | null;
  grade: {
    id: string;
    name: string;
    rate: number;
    minAmount: number;
  };
}
