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

  getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const result = await this.userService.getMe(userId);
    res.status(200).json(result);
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const result = await this.userService.updateMe(userId, req.body);
    res.status(200).json(result);
  };
}
