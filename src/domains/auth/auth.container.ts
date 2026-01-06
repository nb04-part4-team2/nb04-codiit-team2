import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { UserRepository } from '@/domains/user/user.repository.js';

// 의존성 주입
const userRepository = new UserRepository();
const authRepository = new AuthRepository();
const authService = new AuthService(userRepository, authRepository);

export const authController = new AuthController(authService);
