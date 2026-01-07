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
    // 새 리프레시 토큰을 쿠키에 저장 (덮어쓰기)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 액세스 토큰만 JSON으로 반환
    res.status(200).json({
      accessToken: result.accessToken,
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;

    // 토큰이 있으면 DB에서 삭제
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ message: '로그아웃 되었습니다.' });
  };
}
