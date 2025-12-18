import { UserRepository } from '../user/user.repository.js';
import { MetadataController } from './metadata.controller.js';
import { MetadataRepository } from './metadata.repository.js';
import { MetadataService } from './metadata.service.js';

const metadataRepository = new MetadataRepository();
const userRepository = new UserRepository();

const metadataService = new MetadataService(metadataRepository, userRepository);

export const metadataController = new MetadataController(metadataService);
