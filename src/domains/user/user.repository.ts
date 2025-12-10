import prisma from '@/config/prisma.js';
import type { UserType } from '@prisma/client';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  type: UserType;
  gradeId: string;
}

interface UpdateUserData {
  name?: string;
  password?: string;
  image?: string;
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

  async update(id: string, data: UpdateUserData) {
    return prisma.user.update({
      where: { id },
      data,
      include: { grade: true },
    });
  }
}
