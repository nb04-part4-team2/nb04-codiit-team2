import { MetadataController } from './metadata.controller.js';
import { MetadataRepository } from './metadata.repository.js';
import { MetadataService } from './metadata.service.js';

const metadataRepository = new MetadataRepository();

const metadataService = new MetadataService(metadataRepository);

export const metadataController = new MetadataController(metadataService);
