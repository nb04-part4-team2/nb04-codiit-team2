import { MetadataRepository } from './metadata.repository.js';

export class MetadataService {
  constructor(private metadataRepository: MetadataRepository) {}

  async getGradePolicy() {
    return this.metadataRepository.findAllGrades();
  }
}
