import prisma from '@/config/prisma.js';
import { InquiryController } from './inquiry.controller.js';
import { InquiryRepository } from './inquiry.repository.js';
import { InquiryService } from './inquiry.service.js';

// 의존성 주입
const inquiryRepository = new InquiryRepository(prisma);
const inquiryService = new InquiryService(inquiryRepository);

export const inquiryController = new InquiryController(inquiryService);
