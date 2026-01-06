import { UserController } from './user.controller.js';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';
import { AuthRepository } from '@/domains/auth/auth.repository.js';

// 의존성 주입
const userRepository = new UserRepository();
const authRepository = new AuthRepository();
const userService = new UserService(userRepository, authRepository);

export const userController = new UserController(userService);
