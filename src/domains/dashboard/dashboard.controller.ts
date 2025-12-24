import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getDashboardData = async (req: Request, res: Response) => {
    const dashboardData = await this.dashboardService.getDashboardData();
    return res.status(200).json(dashboardData);
  };
}
