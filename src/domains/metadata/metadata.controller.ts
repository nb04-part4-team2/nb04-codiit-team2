import { Request, Response } from 'express';
import { MetadataService } from './metadata.service.js';
import { toGradeListDto } from './metadata.mapper.js';

export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  getGrades = async (req: Request, res: Response) => {
    const gradePolicy = await this.metadataService.getGradePolicy();
    res.status(200).json(toGradeListDto(gradePolicy));
  };
}
