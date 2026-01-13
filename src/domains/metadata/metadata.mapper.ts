import { Grade } from '@prisma/client';
import { GradeDto } from './metadata.dto.js';

export const toGradeDto = (grade: Grade): GradeDto => ({
  id: grade.id,
  name: grade.name,
  rate: Math.round(grade.rate * 100), // 소수점 형태의 적립률을 백분율 정수로 변환
  minAmount: grade.minAmount,
});

export const toGradeListDto = (grades: Grade[]): GradeDto[] => grades.map(toGradeDto);
