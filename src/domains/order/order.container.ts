import prisma from '@/config/prisma.js';
import { OrderController } from '@/domains/order/order.controller.js';
import { OrderRepository } from '@/domains/order/order.repository.js';
import { OrderService } from '@/domains/order/order.service.js';
import { notificationService } from '@/domains/notification/notification.container.js';

const orderRepository = new OrderRepository(prisma);

const orderService = new OrderService(orderRepository, notificationService, prisma);

export const orderController = new OrderController(orderService);
