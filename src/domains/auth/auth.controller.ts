import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { UnauthorizedError } from '@/common/utils/errors.js';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError('토큰이 없습니다.');
    }

    const result = await this.authService.refresh(refreshToken);
    res.status(200).json(result);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie('refreshToken');
    const result = await this.authService.logout();
    res.status(200).json(result);
  };
}
