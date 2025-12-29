import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service.js';
import { UnauthorizedError } from '../../common/utils/errors.js';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getDashboardData = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError('인증이 필요합니다.');
    }
    const dashboardData = await this.dashboardService.getDashboardData(req.user.id);
    return res.status(200).json(dashboardData);
  };
}
