import { DashboardController } from './dashboard.controller.js';
import { DashboardMapper } from './dashboard.mapper.js';
import { DashboardRepository } from './dashboard.repository.js';
import { DashboardService } from './dashboard.service.js';

// Manual dependency injection
const dashboardRepository = new DashboardRepository();
const dashboardMapper = new DashboardMapper();
const dashboardService = new DashboardService(dashboardRepository, dashboardMapper);

export const dashboardController = new DashboardController(dashboardService);
