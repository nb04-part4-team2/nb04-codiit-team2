import { Request, Response } from 'express';
import { UserService } from './user.service.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    const result = await this.userService.createUser(req.body);
    res.status(201).json(result);
  };
}
