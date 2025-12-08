import prisma from '@/config/prisma.js';
import type { UserType } from '@prisma/client';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  type: UserType;
  gradeId: string;
}

export class UserRepository {
  async create(data: CreateUserData) {
    return prisma.user.create({
      data,
      include: { grade: true },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { grade: true },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { grade: true },
    });
  }
}
