import { Grade } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { UserRepository } from '../user/user.repository.js';
import { NotFoundError } from '../../common/utils/errors.js';
import { MetadataRepository } from './metadata.repository.js';

export class MetadataService {
  constructor(
    private metadataRepository: MetadataRepository,
    private userRepository: UserRepository,
  ) {}

  async getMembershipInfo(userId: string) {
    const [user, gradePolicy, paymentAggregation] = await Promise.all([
      this.userRepository.findById(userId),

      this.metadataRepository.findAllGrades(),

      prisma.payment.aggregate({
        _sum: {
          price: true,
        },
        where: {
          status: 'CompletedPayment',
          order: {
            buyerId: userId,
          },
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    const totalPurchaseAmount = paymentAggregation._sum.price ?? 0;
    const userPoint = user.point;

    const currentGrade = gradePolicy
      .slice()
      .sort((a: Grade, b: Grade) => b.minAmount - a.minAmount)
      .find((grade: Grade) => totalPurchaseAmount >= grade.minAmount);

    return {
      user: {
        currentGradeName: currentGrade?.name ?? 'green',
        totalPurchaseAmount,
        points: userPoint,
      },
      gradePolicy,
    };
  }
}
