import prisma from '@/config/prisma.js';
import { OrderController } from '@/domains/order/order.controller.js';
import { OrderRepository } from '@/domains/order/order.repository.js';
import { OrderService } from '@/domains/order/order.service.js';
import { notificationService } from '@/domains/notification/notification.container.js';
import { UserRepository } from '@/domains/user/user.repository.js';
import { UserService } from '@/domains/user/user.service.js';
import { AuthRepository } from '@/domains/auth/auth.repository.js';
import { sseManager } from '@/common/utils/sse.manager.js';

const orderRepository = new OrderRepository(prisma);
const userRepository = new UserRepository();
const authRepository = new AuthRepository();
const userService = new UserService(userRepository, authRepository);
const orderService = new OrderService(
  orderRepository,
  notificationService,
  prisma,
  userService,
  sseManager,
);

export const orderController = new OrderController(orderService);
