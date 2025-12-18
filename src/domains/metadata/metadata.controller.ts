import { Request, Response } from 'express';
import { asyncHandler } from '../../common/middlewares/asyncHandler.js';
import { MetadataService } from './metadata.service.js';

export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  getMembershipInfo = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const membershipInfo = await this.metadataService.getMembershipInfo(userId);

    res.status(200).json({ success: true, data: membershipInfo });
  });
}
