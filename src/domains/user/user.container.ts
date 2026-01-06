import { UserController } from './user.controller.js';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';

// 의존성 주입
const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export const userController = new UserController(userService);
