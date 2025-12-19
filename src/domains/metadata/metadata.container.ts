import { MetadataController } from '@/domains/metadata/metadata.controller.js';
import { MetadataRepository } from '@/domains/metadata/metadata.repository.js';
import { MetadataService } from '@/domains/metadata/metadata.service.js';

const metadataRepository = new MetadataRepository();

const metadataService = new MetadataService(metadataRepository);

export const metadataController = new MetadataController(metadataService);
