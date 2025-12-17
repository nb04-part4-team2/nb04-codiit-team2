import { Request, Response } from 'express';
import { MetadataService } from './metadata.service.js';

export class MetadataController {
  private metadataService: MetadataService;

  constructor() {
    this.metadataService = new MetadataService();
  }

  getGrades = async (req: Request, res: Response): Promise<void> => {
    const grades = await this.metadataService.getGrades();

    res.status(200).json(grades);
  };
}
